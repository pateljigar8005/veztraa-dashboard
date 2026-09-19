import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getUnreadCount } from '@src/views/apps/email/store'
import useJwt from '@src/auth/jwt/useJwt'
import { currentUserCan } from '@src/utility/navPermissions'

const POLL_INTERVAL_MS = 15000

const hasSession = () => Boolean(localStorage.getItem('userData') && useJwt.getToken())

// Keeps the sidebar Email badge current. Runs only while this (logged-in)
// layout is mounted, checks for a live session before every request, and
// skips hidden tabs - so it never hits the API after logout.
export const useEmailUnreadPolling = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!currentUserCan('/email', 'view')) return undefined

    const poll = () => {
      if (document.hidden || !hasSession()) return
      dispatch(getUnreadCount())
    }

    poll()
    const timer = setInterval(poll, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', poll)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [])
}
