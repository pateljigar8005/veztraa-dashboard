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
import { applyThemeColor, getCachedThemeColor, setCachedThemeColor, isValidHexColor, THEME_COLOR_STORAGE_KEY } from './utility/themeColor'

installChunkPreloadErrorHandler()

const LazyApp = lazy(() => import('./App'))

function renderApp() {
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
}

// Hits the public /company/theme endpoint (not the authenticated /company
// one) specifically so this also works on the login page itself, before
// anyone has a token.
const fetchThemeColor = () =>
  axios
    .get('/company/theme', { signal: new AbortController().signal })
    .then(response => response.data?.data?.theme_primary_color)
    .catch(() => null)

let rawCachedColor = null
try {
  rawCachedColor = localStorage.getItem(THEME_COLOR_STORAGE_KEY)
} catch (e) {
  // localStorage unavailable (private mode, etc.) - treated as "nothing cached" below
}

if (isValidHexColor(rawCachedColor)) {
  // A real color is already cached from a previous visit - apply it and
  // render immediately, no need to make anyone wait on a network round trip
  // just to double-check it. The API is still checked afterwards, in the
  // background, in case the color changed from another device/browser -
  // this request is issued before the router has settled on its real route
  // (e.g. a "/" -> "/dashboard" redirect right after boot), and
  // axiosConfig's route-change interceptor aborts every GET tagged with a
  // path the app has since navigated away from; fetchThemeColor() supplies
  // its own signal to opt out of that auto-cancel.
  applyThemeColor(rawCachedColor)
  renderApp()
  fetchThemeColor().then(hex => {
    if (hex && isValidHexColor(hex) && hex !== rawCachedColor) {
      setCachedThemeColor(hex)
      applyThemeColor(hex)
    }
  })
} else {
  // Nothing cached yet (first visit, incognito, cleared storage) - rendering
  // immediately with the default purple and then snapping to the real brand
  // color the moment the API answers is exactly the jarring flash this is
  // meant to avoid. Wait briefly for the real answer first instead; a hard
  // cap means a slow/offline API still can't block the app from loading
  // forever, it just falls back to the default like before.
  const WAIT_FOR_THEME_MS = 1200
  Promise.race([fetchThemeColor(), new Promise(resolve => setTimeout(() => resolve(null), WAIT_FOR_THEME_MS))]).then(
    hex => {
      const resolvedHex = isValidHexColor(hex) ? hex : getCachedThemeColor()
      if (isValidHexColor(hex)) setCachedThemeColor(hex)
      applyThemeColor(resolvedHex)
      renderApp()
    }
  )
}