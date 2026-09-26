import { lazy } from 'react'

const LoginBasic = lazy(() => import('../../views/pages/authentication/LoginBasic'))
const ForgotPasswordBasic = lazy(() => import('../../views/pages/authentication/ForgotPasswordBasic'))
const ResetPasswordBasic = lazy(() => import('../../views/pages/authentication/ResetPasswordBasic'))

const AuthenticationRoutes = [
  {
    path: '/login',
    element: <LoginBasic />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordBasic />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/reset-password',
    element: <ResetPasswordBasic />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  }
]

export default AuthenticationRoutes