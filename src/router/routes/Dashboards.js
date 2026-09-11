import { lazy } from 'react'

const DashboardEcommerce = lazy(() => import('../../views/dashboard/ecommerce'))

const DashboardRoutes = [
  {
    path: '/dashboard',
    element: <DashboardEcommerce />
  }
]

export default DashboardRoutes
