// ** Axios base config for the Veztraa PHP API
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8081'
axios.defaults.withCredentials = true

// ** Cancel in-flight GET requests left over from a page you've navigated
// away from, instead of letting them run to completion in the background.
// Every module fetches its list/detail data the same way (dispatch a thunk
// in a mount effect - see CLAUDE.md), so this is done centrally here rather
// than threading an AbortController through every store/index.js: each GET
// request is tagged with the pathname that was active when it was issued,
// and RouteRequestCanceller (mounted once near the app root) calls
// abortRequestsFromPath() with the OLD pathname right after it changes.
// Only GETs are ever auto-cancelled - a POST/PUT/DELETE (sending an email,
// saving a form) must always be allowed to finish even if the user
// navigates away mid-request, since cutting it off could leave a write in
// an ambiguous, possibly-half-done state.
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
