import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8081'
axios.defaults.withCredentials = true

const pendingGetRequests = new Map()

axios.interceptors.request.use(config => {
  if ((config.method || 'get').toLowerCase() === 'get' && !config.signal) {
    const controller = new AbortController()
    config.signal = controller.signal
    pendingGetRequests.set(config, { controller, path: window.location.pathname })
  }
  return config
})

axios.interceptors.response.use(
  response => {
    pendingGetRequests.delete(response.config)
    return response
  },
  error => {
    if (error.config) pendingGetRequests.delete(error.config)
    return Promise.reject(error)
  }
)

export const abortRequestsFromPath = path => {
  pendingGetRequests.forEach(({ controller, path: requestPath }, config) => {
    if (requestPath === path) {
      controller.abort()
      pendingGetRequests.delete(config)
    }
  })
}

export default axios