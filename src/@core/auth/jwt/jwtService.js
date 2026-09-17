import axios from 'axios'
import jwtDefaultConfig from './jwtDefaultConfig'

// ** The access token's own server-side lifetime is 15 min (see
// veztraa-api/config/config.php's JWT_ACCESS_TTL) - refreshing this many
// seconds BEFORE it actually expires (see scheduleProactiveRefresh() below)
// means a normal, continuously-active session refreshes ahead of time on
// its own and never actually hits a real request with an expired token in
// the first place. The reactive 401-triggered refresh below still exists as
// a backstop (laptop sleep/wake, clock drift, a tab that was backgrounded
// long enough for its timer to get throttled by the browser), but is no
// longer the ONLY thing standing between a normal 15-minute session and a
// visible "Unauthorized" error.
const PROACTIVE_REFRESH_BUFFER_SECONDS = 60

export default class JwtService {
  // ** jwtConfig <= Will be used by this service
  jwtConfig = { ...jwtDefaultConfig }

  // ** For Refreshing Token
  isAlreadyFetchingAccessToken = false

  // ** For Refreshing Token
  subscribers = []

  // ** Timer handle for the proactive refresh below - re-armed every time a
  // new access token is stored, so only the MOST RECENT token's expiry is
  // ever scheduled against.
  refreshTimer = null

  constructor(jwtOverrideConfig) {
    this.jwtConfig = { ...this.jwtConfig, ...jwtOverrideConfig }

    // Covers a page reload with an existing session - login itself writes
    // tokens straight to localStorage (see redux/authentication.js's
    // handleLogin, which calls scheduleProactiveRefresh() itself right
    // after) rather than through setToken() below, so this constructor is
    // what picks the timer back up on every OTHER page load.
    this.scheduleProactiveRefresh(this.getToken())

    // ** Request Interceptor
    axios.interceptors.request.use(
      config => {
        // ** Get token from localStorage
        const accessToken = this.getToken()

        // ** If token is present add it to request's Authorization Header
        if (accessToken) {
          // ** eslint-disable-next-line no-param-reassign
          config.headers.Authorization = `${this.jwtConfig.tokenType} ${accessToken}`
        }
        return config
      },
      error => Promise.reject(error)
    )

    // ** Add request/response interceptor
    axios.interceptors.response.use(
      response => response,
      error => {
        // ** const { config, response: { status } } = error
        const { config, response } = error
        const originalRequest = config

        // ** if (status === 401) {
        if (response && response.status === 401) {
          // ** A 401 from the refresh call itself means the session is
          // genuinely over - retrying it or queuing more requests behind it
          // would just hang forever, since no valid token will ever arrive.
          if (originalRequest.url === this.jwtConfig.refreshEndpoint) {
            this.isAlreadyFetchingAccessToken = false
            this.onAccessTokenFetchFailed()
            return Promise.reject(error)
          }

          if (!this.isAlreadyFetchingAccessToken) {
            this.isAlreadyFetchingAccessToken = true
            this.refreshToken()
              .then(r => {
                this.isAlreadyFetchingAccessToken = false

                // ** Update accessToken in localStorage
                this.setToken(r.data.accessToken)
                this.setRefreshToken(r.data.refreshToken)

                this.onAccessTokenFetched(r.data.accessToken)
              })
              .catch(() => {
                this.isAlreadyFetchingAccessToken = false
                this.onAccessTokenFetchFailed()
              })
          }
          const retryOriginalRequest = new Promise((resolve, reject) => {
            this.addSubscriber({
              onSuccess: accessToken => {
                // ** Make sure to assign accessToken according to your response.
                // ** Check: https://pixinvent.ticksy.com/ticket/2413870
                // ** Change Authorization header
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

  // ** Reads a JWT's `exp` claim without verifying its signature - fine
  // here since this only ever drives a client-side refresh TIMER, never an
  // authorization decision (the server independently verifies + enforces
  // expiry on every request regardless of what this reads).
  decodeExp(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      return typeof payload.exp === 'number' ? payload.exp : null
    } catch (e) {
      return null
    }
  }

  // ** Arms a timer to refresh BEFORE the given access token actually
  // expires (see PROACTIVE_REFRESH_BUFFER_SECONDS) - called from the
  // constructor (existing session on page load), setToken() (right after
  // any refresh, reactive or proactive, so the NEXT one is scheduled off
  // the NEW token), and redux/authentication.js's handleLogin (a fresh
  // login, which writes tokens directly rather than through setToken()).
  scheduleProactiveRefresh(token) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    if (!token) return

    const exp = this.decodeExp(token)
    if (!exp) return

    // Already past the buffer (e.g. the tab was backgrounded and its timers
    // throttled right up to/past the token's real expiry) - refresh right
    // away instead of scheduling a negative delay, which setTimeout would
    // otherwise just fire immediately anyway.
    const msUntilRefresh = Math.max(0, exp * 1000 - PROACTIVE_REFRESH_BUFFER_SECONDS * 1000 - Date.now())
    this.refreshTimer = setTimeout(() => this.proactiveRefresh(), msUntilRefresh)
  }

  // ** Same refreshToken() call the reactive 401 handler above uses, just
  // triggered by the timer instead of a failed request - shares
  // isAlreadyFetchingAccessToken so the two never race each other (if a
  // real request happens to 401 right as this fires, whichever gets there
  // first wins and the other's subscribers/timer just ride along).
  proactiveRefresh() {
    if (this.isAlreadyFetchingAccessToken || !this.getRefreshToken()) return

    this.isAlreadyFetchingAccessToken = true
    this.refreshToken()
      .then(r => {
        this.isAlreadyFetchingAccessToken = false
        this.setToken(r.data.accessToken)
        this.setRefreshToken(r.data.refreshToken)
        this.onAccessTokenFetched(r.data.accessToken)
      })
      .catch(() => {
        this.isAlreadyFetchingAccessToken = false
        // Not fatal the way a REACTIVE failure is - the current token may
        // still be good for another ~60s, and a real request hitting a
        // genuine 401 later still triggers the interceptor's own
        // onAccessTokenFetchFailed() (session truly over -> clean re-login).
      })
  }

  // ** Refresh token itself is invalid/expired - nothing queued behind it
  // can ever succeed, so reject them all and force a clean re-login instead
  // of leaving the app hung on a token that will never arrive.
  onAccessTokenFetchFailed() {
    this.subscribers.forEach(subscriber => subscriber.onFailure())
    this.subscribers = []
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    localStorage.removeItem(this.jwtConfig.storageTokenKeyName)
    localStorage.removeItem(this.jwtConfig.storageRefreshTokenKeyName)
    window.location.href = '/login'
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
}
