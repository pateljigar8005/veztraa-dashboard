// ** React Imports
import { Navigate, useLocation } from 'react-router-dom'
import { useContext, Suspense } from 'react'

// ** Context Imports
import { AbilityContext } from '@src/utility/context/Can'

// ** Utils
import { canAccessRoute, hasActionPermission, inferRouteAction } from '@src/utility/navPermissions'

// ** Spinner Import
import Spinner from '../spinner/Loading-spinner'

const PrivateRoute = ({ children, route }) => {
  // ** Hooks & Vars
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
      return <Navigate to='/misc/not-authorized' replace />
    }
    if (user && !canAccessRoute(location.pathname, user)) {
      return <Navigate to='/misc/not-authorized' replace />
    }

    // "view" only covers seeing the module - opening an /add or /edit/:id
    // page directly (e.g. by typing the URL) also requires that specific
    // action, even if the module itself is otherwise visible.
    const requiredAction = inferRouteAction(location.pathname)
    if (user && requiredAction && !hasActionPermission(location.pathname, requiredAction, user)) {
      return <Navigate to='/misc/not-authorized' replace />
    }
  }

  return <Suspense fallback={<Spinner className='content-loader' />}>{children}</Suspense>
}

export default PrivateRoute
