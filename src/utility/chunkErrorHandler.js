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
  state = { hasError: false, isChunkError: false, reloaded: false }

  // A non-chunk error used to fall through with hasError: false, so this
  // boundary rendered the same crashing children again immediately - an
  // infinite render-crash-remount loop (which itself re-triggers every
  // mount-time request in the app, e.g. the navbar's polling hooks) instead
  // of a plain error screen. Any caught error now stops re-rendering
  // children; only a genuine chunk-load error attempts the reload.
  static getDerivedStateFromError(error) {
    return { hasError: true, isChunkError: isChunkLoadError(error) }
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) {
      this.setState({ reloaded: reloadOnce() })
    } else {
      console.error(error)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        if (!this.state.reloaded) {
          // Already reloaded once this session and it's still failing (e.g. offline)
          console.error('Failed to load app after reload; skipping further reloads')
        }
        return null
      }

      // A non-chunk render error used to be swallowed here by clearing
      // hasError and re-rendering props.children, which actually remounts
      // the whole app fresh (React already tore the old tree down to reach
      // this boundary). If the error came from stale data that's still
      // there after remount (e.g. a bad dashboard API response), that
      // remount crashes again immediately - looping forever and, since the
      // remounted app re-fires its own startup requests every time,
      // flooding the browser with network calls. Show a static fallback
      // instead of ever retrying automatically.
      return (
        <div className='d-flex flex-column align-items-center justify-content-center text-center p-2' style={{ minHeight: '100vh' }}>
          <h4>Something went wrong</h4>
          <p className='text-muted'>Please refresh the page. If this keeps happening, let support know.</p>
        </div>
      )
    }

    return this.props.children
  }
}
