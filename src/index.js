import './utility/reportDesignerStyleGuard'
import { installChunkPreloadErrorHandler, ChunkErrorBoundary } from './utility/chunkErrorHandler'
import { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { store } from './redux/store'
import { Provider } from 'react-redux'
import ability from './configs/acl/ability'
import { AbilityContext } from './utility/context/Can'
import { ThemeContext } from './utility/context/ThemeColors'
import themeConfig from './configs/themeConfig'
import { Toaster } from 'react-hot-toast'
import Spinner from './@core/components/spinner/Fallback-spinner'
import './@core/components/ripple-button'
import './configs/axiosConfig'
import './@fake-db'
import 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-jsx.min'
import 'react-perfect-scrollbar/dist/css/styles.css'
import '@styles/react/libs/react-hot-toasts/react-hot-toasts.scss'
import './@core/scss/base/plugins/extensions/ext-component-sweet-alerts.scss'
import './@core/assets/fonts/feather/iconfont.css'
import './@core/scss/core.scss'
import './assets/scss/style.scss'
import * as serviceWorker from './serviceWorker'
import axios from 'axios'
import { applyThemeColor, getCachedThemeColor, setCachedThemeColor } from './utility/themeColor'

installChunkPreloadErrorHandler()

// Apply the cached company theme color before anything renders - no flash,
// no waiting on the API. The API is only checked afterwards, in the
// background, in case the color changed from another device/browser.
applyThemeColor(getCachedThemeColor())

const LazyApp = lazy(() => import('./App'))

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <BrowserRouter>
    <Provider store={store}>
      <ChunkErrorBoundary>
        <Suspense fallback={<Spinner />}>
          <AbilityContext.Provider value={ability}>
            <ThemeContext>
              <LazyApp />
              <Toaster position={themeConfig.layout.toastPosition} toastOptions={{ className: 'react-hot-toast' }} />
            </ThemeContext>
          </AbilityContext.Provider>
        </Suspense>
      </ChunkErrorBoundary>
    </Provider>
  </BrowserRouter>
)

serviceWorker.unregister()

// Background refresh only - never blocks or delays the first paint above.
// Runs after login too since axios only carries a token once one exists;
// a 401 on a public/login screen is expected and harmless here.
//
// This request is issued before the router has settled on its real route
// (e.g. a "/" -> "/dashboard" redirect right after boot), and axiosConfig's
// route-change interceptor aborts every GET tagged with a path the app has
// since navigated away from. Supplying our own signal here opts this
// request out of that auto-cancel (the interceptor only wraps requests
// where no signal is already set) so it isn't silently killed by the very
// first navigation.
axios
  .get('/company', { signal: new AbortController().signal })
  .then(response => {
    const hex = response.data?.data?.theme_primary_color
    if (hex && hex !== getCachedThemeColor()) {
      setCachedThemeColor(hex)
      applyThemeColor(hex)
    }
  })
  .catch(() => {})