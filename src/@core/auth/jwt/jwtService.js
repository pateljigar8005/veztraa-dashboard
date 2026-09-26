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

          if (!this.isAlreadyFetchingAccessToken) {
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
    this.refreshToken()
      .then(r => {
        this.isAlreadyFetchingAccessToken = false
        this.setToken(r.data.accessToken)
        this.setRefreshToken(r.data.refreshToken)
        this.onAccessTokenFetched(r.data.accessToken)
      })
      .catch(() => {
        this.isAlreadyFetchingAccessToken = false
      })
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

  forgotPassword(...args) {
    return axios.post(this.jwtConfig.forgotPasswordEndpoint, ...args)
  }

  resetPassword(...args) {
    return axios.post(this.jwtConfig.resetPasswordEndpoint, ...args)
  }
}