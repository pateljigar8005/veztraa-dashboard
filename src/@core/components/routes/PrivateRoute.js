import { Navigate, useLocation } from 'react-router-dom'
import { useContext, Suspense } from 'react'
import { AbilityContext } from '@src/utility/context/Can'
import { canAccessRoute, hasActionPermission, inferRouteAction } from '@src/utility/navPermissions'
import Spinner from '../spinner/Loading-spinner'

const PrivateRoute = ({ children, route }) => {
  const ability = useContext(AbilityContext)
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('userData'))

  if (route) {
    let action = null
    let resource = null
    let restrictedRoute = false

    if (route.meta) {
      action = route.meta.action
      resource = route.meta.resource
      restrictedRoute = route.meta.restricted
    }
    if (!user) {
      return <Navigate to='/login' />
    }
    if (user && restrictedRoute) {
      return <Navigate to='/' />
    }
    if (user && !ability.can(action || 'read', resource)) {
      return <Navigate to='/auth/not-auth' replace />
    }
    if (user && !canAccessRoute(location.pathname, user)) {
      return <Navigate to='/auth/not-auth' replace />
    }

    const requiredAction = inferRouteAction(location.pathname)
    if (user && requiredAction && !hasActionPermission(location.pathname, requiredAction, user)) {
      return <Navigate to='/auth/not-auth' replace />
    }
  }

  return <Suspense fallback={<Spinner className='content-loader' />}>{children}</Suspense>
}

export default PrivateRoute