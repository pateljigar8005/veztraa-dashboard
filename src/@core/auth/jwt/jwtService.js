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
      config => {
        const accessToken = this.getToken()

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

          // No refresh token means there was never a session to refresh (e.g.
          // a background request firing on the public login page before the
          // user has signed in). Attempting a refresh here would itself 401
          // against refreshEndpoint above and redirect to /login, which -
          // since we're already there - just reloads the page and repeats.
          if (!this.getRefreshToken()) {
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