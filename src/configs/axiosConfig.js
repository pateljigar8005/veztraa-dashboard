import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8081'
axios.defaults.withCredentials = true
// Without this, a request that hangs (a slow endpoint, a dropped
// connection) never settles at all - whatever `loading` flag it's gating
// stays true forever, since neither .then nor .catch ever fires. 30s is
// generous for even a heavy aggregate endpoint like /dashboard/summary,
// but still guarantees the UI eventually recovers instead of being stuck
// until the page is reloaded or navigated away from and back to.
axios.defaults.timeout = 30000

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