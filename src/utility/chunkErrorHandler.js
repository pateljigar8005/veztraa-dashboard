// Handles "Failed to fetch dynamically imported module" errors that happen
// when a browser tab stays open across a deploy and requests an old,
// hashed chunk (e.g. assets/index.<hash>.js) that no longer exists on the
// server. A single reload picks up the new build; the sessionStorage flag
// stops a repeat failure (e.g. offline) from reloading in a loop.
import { Component } from 'react'

const RELOAD_FLAG = 'veztraa-chunk-reload'

const isChunkLoadError = error => {
  if (!error) return false
  const message = error.message || String(error)

  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
    message
  )
}

const reloadOnce = () => {
  if (sessionStorage.getItem(RELOAD_FLAG)) return false
  sessionStorage.setItem(RELOAD_FLAG, '1')
  window.location.reload()

  return true
}

// Vite emits this event on the window when a dynamically imported/preloaded
// module fails to fetch, before React ever sees an error.
export const installChunkPreloadErrorHandler = () => {
  window.addEventListener('vite:preloadError', () => {
    reloadOnce()
  })
}

export class ChunkErrorBoundary extends Component {
  state = { hasError: false, reloaded: false }

  static getDerivedStateFromError(error) {
    return { hasError: isChunkLoadError(error) }
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) {
      this.setState({ reloaded: reloadOnce() })
    }
  }

  render() {
    if (this.state.hasError) {
      if (!this.state.reloaded) {
        // Already reloaded once this session and it's still failing (e.g. offline)
        console.error('Failed to load app after reload; skipping further reloads')
      }

      return null
    }

    return this.props.children
  }
}
