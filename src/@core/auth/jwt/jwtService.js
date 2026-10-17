import axios from 'axios'
import jwtDefaultConfig from './jwtDefaultConfig'

const PROACTIVE_REFRESH_BUFFER_SECONDS = 60

export default class JwtService {
  jwtConfig = { ...jwtDefaultConfig }

  isAlreadyFetchingAccessToken = false

  subscribers = []

  refreshTimer = null

  constructor(jwtOverrideConfig) {
    this.jwtConfig = { ...this.jwtConfig, ...jwtOverrideConfig }

    this.scheduleProactiveRefresh(this.getToken())

    axios.interceptors.request.use(
      async config => {
        // Login/refresh/etc never need - and must never wait on - a fresh
        // access token: ensureFreshToken() awaiting a refresh that itself
        // posts to refreshEndpoint through this same interceptor would
        // deadlock on its own in-flight flag.
        const publicEndpoints = [
          this.jwtConfig.loginEndpoint,
          this.jwtConfig.registerEndpoint,
          this.jwtConfig.refreshEndpoint,
          this.jwtConfig.logoutEndpoint,
          this.jwtConfig.forgotPasswordEndpoint,
          this.jwtConfig.resetPasswordEndpoint
        ]
        if (publicEndpoints.includes(config.url)) {
          return config
        }

        const accessToken = await this.ensureFreshToken()
        if (accessToken) {
          config.headers.Authorization = `${this.jwtConfig.tokenType} ${accessToken}`
        }
        return config
      },
      error => Promise.reject(error)
    )

    axios.interceptors.response.use(
      response => response,
      error => {
        const { config, response } = error
        const originalRequest = config

        if (response && response.status === 401) {
          if (originalRequest.url === this.jwtConfig.refreshEndpoint) {
            this.isAlreadyFetchingAccessToken = false
            this.onAccessTokenFetchFailed()
            return Promise.reject(error)
          }

          // No refresh token usually means there was never a session to
          // refresh (e.g. a background request firing on the public login
          // page before the user has signed in) - but it can also mean a
          // real session on an authenticated page lost its refresh token
          // (storage cleared, an earlier failed refresh, etc.) while an
          // access token lingered. onAccessTokenFetchFailed() already
          // no-ops its own redirect when we're on a public auth page, so
          // routing both cases through it is safe either way - it just
          // means a dead session on a real page actually bounces to
          // /login instead of being stuck re-401ing forever with no
          // recovery path.
          if (!this.getRefreshToken()) {
            this.onAccessTokenFetchFailed()
            return Promise.reject(error)
          }

          // A request that still 401s after already being retried once with
          // a freshly refreshed token means the new token isn't valid for it
          // either - refreshing again would just repeat the same 401
          // forever. With several polling hooks (notifications, unread
          // count, synced user data) all hitting this at once, that unbounded
          // loop is what flooded the browser with requests until it ran out
          // of resources. Give up and force a re-login instead of looping.
          if (originalRequest._retriedAfterRefresh) {
            this.onAccessTokenFetchFailed()
            return Promise.reject(error)
          }
          originalRequest._retriedAfterRefresh = true

          if (!this.isAlreadyFetchingAccessToken) {
            this.isAlreadyFetchingAccessToken = true
            this.performRefresh()
              .then(({ accessToken }) => {
                this.isAlreadyFetchingAccessToken = false
                this.onAccessTokenFetched(accessToken)
              })
              .catch(() => {
                this.isAlreadyFetchingAccessToken = false
                this.onAccessTokenFetchFailed()
              })
          }
          const retryOriginalRequest = new Promise((resolve, reject) => {
            this.addSubscriber({
              onSuccess: accessToken => {
                originalRequest.headers.Authorization = `${this.jwtConfig.tokenType} ${accessToken}`
                resolve(axios(originalRequest))
              },
              onFailure: () => reject(error)
            })
          })
          return retryOriginalRequest
        }
        return Promise.reject(error)
      }
    )
  }

  // Called from the request interceptor before every authenticated call -
  // refreshes ahead of time if the stored token is already past (or close
  // to) its expiry, instead of sending it, taking the guaranteed 401, and
  // only then refreshing. That round trip used to repeat for every request
  // in flight the moment a tab resumes with a stale token (e.g. the
  // dashboard's half-dozen parallel widget calls on mount), which is what
  // made the first load after any idle period slow or flaky while every
  // later load (fresh token already in hand) was instant.
  async ensureFreshToken() {
    const token = this.getToken()
    if (!token) return null

    const exp = this.decodeExp(token)
    const isFresh = exp && exp * 1000 - PROACTIVE_REFRESH_BUFFER_SECONDS * 1000 > Date.now()
    if (isFresh) return token

    // We already know there IS an access token (the !token check above
    // would've returned otherwise), so reaching here with no refresh token
    // can only be a dead/incomplete session, never the pristine
    // never-logged-in case - sending the stale token anyway would just
    // guarantee a 401 with no way to recover from it. Clean up and bounce
    // to /login instead (a no-op if we're already on a public auth page).
    if (!this.getRefreshToken()) {
      this.onAccessTokenFetchFailed()
      return null
    }

    if (this.isAlreadyFetchingAccessToken) {
      return new Promise(resolve => {
        this.addSubscriber({ onSuccess: resolve, onFailure: () => resolve(this.getToken()) })
      })
    }

    this.isAlreadyFetchingAccessToken = true
    try {
      const { accessToken } = await this.performRefresh()
      this.isAlreadyFetchingAccessToken = false
      this.onAccessTokenFetched(accessToken)
      return accessToken
    } catch (e) {
      this.isAlreadyFetchingAccessToken = false
      this.onAccessTokenFetchFailed()
      return null
    }
  }

  onAccessTokenFetched(accessToken) {
    this.subscribers.forEach(subscriber => subscriber.onSuccess(accessToken))
    this.subscribers = []
  }

  decodeExp(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      return typeof payload.exp === 'number' ? payload.exp : null
    } catch (e) {
      return null
    }
  }

  scheduleProactiveRefresh(token) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    if (!token) return

    const exp = this.decodeExp(token)
    if (!exp) return

    const msUntilRefresh = Math.max(0, exp * 1000 - PROACTIVE_REFRESH_BUFFER_SECONDS * 1000 - Date.now())
    this.refreshTimer = setTimeout(() => this.proactiveRefresh(), msUntilRefresh)
  }

  proactiveRefresh() {
    if (this.isAlreadyFetchingAccessToken || !this.getRefreshToken()) return

    this.isAlreadyFetchingAccessToken = true
    this.performRefresh()
      .then(({ accessToken }) => {
        this.isAlreadyFetchingAccessToken = false
        this.onAccessTokenFetched(accessToken)
      })
      .catch(() => {
        this.isAlreadyFetchingAccessToken = false
      })
  }

  // Refresh tokens are single-use and rotated server-side, but localStorage
  // is shared by every tab on the same origin. With more than one dashboard
  // tab open, their proactive-refresh timers (both scheduled off the same
  // access token's expiry) fire moments apart, both read the same
  // refreshToken, and the server only honors whichever request lands first.
  // The loser's now-already-deleted token genuinely 401s, which used to wipe
  // the (shared) localStorage tokens out from under the tab that just won -
  // that tab kept rendering as logged in while every subsequent API call
  // 401'd with no token at all. Web Locks serializes refreshes across tabs;
  // once a tab gets the lock it re-checks localStorage first, since a
  // sibling tab may have already refreshed while it was waiting, and just
  // reuses those tokens instead of racing a second refresh against them.
  performRefresh() {
    const tokenBeingRefreshed = this.getRefreshToken()
    const run = async () => {
      const currentRefreshToken = this.getRefreshToken()
      if (currentRefreshToken && currentRefreshToken !== tokenBeingRefreshed) {
        return { accessToken: this.getToken(), refreshToken: currentRefreshToken }
      }
      const r = await this.refreshToken()
      this.setToken(r.data.accessToken)
      this.setRefreshToken(r.data.refreshToken)
      return { accessToken: r.data.accessToken, refreshToken: r.data.refreshToken }
    }

    if (typeof navigator !== 'undefined' && navigator.locks && navigator.locks.request) {
      return navigator.locks.request('veztraa-jwt-refresh', run)
    }
    return run()
  }

  onAccessTokenFetchFailed() {
    this.subscribers.forEach(subscriber => subscriber.onFailure())
    this.subscribers = []
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    localStorage.removeItem(this.jwtConfig.storageTokenKeyName)
    localStorage.removeItem(this.jwtConfig.storageRefreshTokenKeyName)
    // A real logout (redux/authentication.js's handleLogout) clears this
    // too - leaving it behind here made this a half-logout: PublicRoute.js
    // only checks getUserData() (not the tokens) to decide whether a public
    // route like /forgot-password should redirect a "logged in" user to the
    // dashboard, so a stale userData with no valid session behind it sent
    // people there anyway - visible as the dashboard flashing for a moment
    // before its own auth check bounced them straight back out.
    localStorage.removeItem('userData')
    // Avoid a reload loop if this fires while already on a public auth page.
    if (!/^\/(login|register|forgot-password|reset-password)/.test(window.location.pathname)) {
      window.location.href = '/login'
    }
  }

  addSubscriber(subscriber) {
    this.subscribers.push(subscriber)
  }

  getToken() {
    return localStorage.getItem(this.jwtConfig.storageTokenKeyName)
  }

  getRefreshToken() {
    return localStorage.getItem(this.jwtConfig.storageRefreshTokenKeyName)
  }

  setToken(value) {
    localStorage.setItem(this.jwtConfig.storageTokenKeyName, value)
    this.scheduleProactiveRefresh(value)
  }

  setRefreshToken(value) {
    localStorage.setItem(this.jwtConfig.storageRefreshTokenKeyName, value)
  }

  login(...args) {
    return axios.post(this.jwtConfig.loginEndpoint, ...args)
  }

  register(...args) {
    return axios.post(this.jwtConfig.registerEndpoint, ...args)
  }

  refreshToken() {
    return axios.post(this.jwtConfig.refreshEndpoint, {
      refreshToken: this.getRefreshToken()
    })
  }

  logout() {
    return axios.post(this.jwtConfig.logoutEndpoint, {
      refreshToken: this.getRefreshToken()
    })
  }

  forgotPassword(...args) {
    return axios.post(this.jwtConfig.forgotPasswordEndpoint, ...args)
  }

  resetPassword(...args) {
    return axios.post(this.jwtConfig.resetPasswordEndpoint, ...args)
  }
}