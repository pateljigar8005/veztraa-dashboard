import { lazy } from 'react'

const Error = lazy(() => import('../../views/pages/misc/Error'))
const ComingSoon = lazy(() => import('../../views/pages/misc/ComingSoon'))
const Maintenance = lazy(() => import('../../views/pages/misc/Maintenance'))
const NotAuthorized = lazy(() => import('../../views/pages/misc/NotAuthorized'))

const PagesRoutes = [
  {
    path: '/misc/coming-soon',
    element: <ComingSoon />,
    meta: {
      publicRoute: true,
      layout: 'blank'
    }
  },
  {
    path: '/misc/not-authorized',
    element: <NotAuthorized />,
    meta: {
      publicRoute: true,
      layout: 'blank'
    }
  },
  {
    path: '/misc/maintenance',
    element: <Maintenance />,
    meta: {
      publicRoute: true,
      layout: 'blank'
    }
  },
  {
    path: '/misc/error',
    element: <Error />,
    meta: {
      publicRoute: true,
      layout: 'blank'
    }
  }
]

export default PagesRoutes
