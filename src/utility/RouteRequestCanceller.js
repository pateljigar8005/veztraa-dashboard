import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { abortRequestsFromPath } from '@configs/axiosConfig'

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