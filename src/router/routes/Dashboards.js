import { lazy } from 'react'

const DashboardEcommerce = lazy(() => import('../../views/dashboard'))

const DashboardRoutes = [
  {
    path: '/dashboard',
    element: <DashboardEcommerce />
  }
]

export default DashboardRoutes