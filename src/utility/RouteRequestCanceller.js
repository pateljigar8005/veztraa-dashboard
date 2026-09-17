// ** React Imports
import { useEffect, useRef } from 'react'

// ** Router Imports
import { useLocation } from 'react-router-dom'

// ** Config
import { abortRequestsFromPath } from '@configs/axiosConfig'

// Cancels whatever GET requests are still in flight from the page you just
// navigated away from (see axiosConfig.js) - tagging happens at request time
// by the pathname active then, so this stays correct regardless of whether
// this effect happens to run before or after the new page's own mount
// effect fires its own fresh request.
const RouteRequestCanceller = () => {
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      abortRequestsFromPath(prevPathRef.current)
      prevPathRef.current = location.pathname
    }
  }, [location.pathname])

  return null
}

export default RouteRequestCanceller
