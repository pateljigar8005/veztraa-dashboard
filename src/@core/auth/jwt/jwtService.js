import axios from 'axios'
import jwtDefaultConfig from './jwtDefaultConfig'

export default class JwtService {
  // ** jwtConfig <= Will be used by this service
  jwtConfig = { ...jwtDefaultConfig }

  // ** For Refreshing Token
  isAlreadyFetchingAccessToken = false

  // ** For Refreshing Token
  subscribers = []

  constructor(jwtOverrideConfig) {
    this.jwtConfig = { ...this.jwtConfig, ...jwtOverrideConfig }

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

  // ** Refresh token itself is invalid/expired - nothing queued behind it
  // can ever succeed, so reject them all and force a clean re-login instead
  // of leaving the app hung on a token that will never arrive.
  onAccessTokenFetchFailed() {
    this.subscribers.forEach(subscriber => subscriber.onFailure())
    this.subscribers = []
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
