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

installChunkPreloadErrorHandler()

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