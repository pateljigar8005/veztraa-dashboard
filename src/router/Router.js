import { lazy } from 'react'
import { useRoutes, Navigate } from 'react-router-dom'
import BlankLayout from '@layouts/BlankLayout'
import { useLayout } from '@hooks/useLayout'
import { getUserData, getHomeRouteForLoggedInUser } from '../utility/Utils'
import { getRoutes } from './routes'

const Error = lazy(() => import('../views/pages/Error'))
const Login = lazy(() => import('../views/pages/authentication/LoginBasic'))
const NotAuthorized = lazy(() => import('../views/pages/NotAuthorized'))

const Router = () => {
  const { layout } = useLayout()

  const allRoutes = getRoutes(layout)
  const getHomeRoute = () => {
    const user = getUserData()
    if (user) {
      return getHomeRouteForLoggedInUser(user.role)
    } else {
      return '/login'
    }
  }

  const routes = useRoutes([
    {
      path: '/',
      index: true,
      element: <Navigate replace to={getHomeRoute()} />
    },
    {
      path: '/login',
      element: <BlankLayout />,
      children: [{ path: '/login', element: <Login /> }]
    },
    {
      path: '/auth/not-auth',
      element: <BlankLayout />,
      children: [{ path: '/auth/not-auth', element: <NotAuthorized /> }]
    },
    {
      path: '*',
      element: <BlankLayout />,
      children: [{ path: '*', element: <Error /> }]
    },
    ...allRoutes
  ])

  return routes
}

export default Router