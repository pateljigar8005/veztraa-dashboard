import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getNotifications } from '@src/redux/notifications'
import useJwt from '@src/auth/jwt/useJwt'

const POLL_INTERVAL_MS = 15000

const hasSession = () => Boolean(localStorage.getItem('userData') && useJwt.getToken())

// Keeps the navbar notification bell current - same shape as
// useEmailUnreadPolling.js (runs only while logged in, checks for a live
// session before every request, skips hidden tabs). No client-side
// permission pre-check here (unlike the email one) - the endpoint itself
// is gated per source (contactSubmissions/jobApplications/kanban/todo), and
// most roles have at least one of those, so it always polls while a
// session exists rather than guessing which permission to check first.
export const useNotificationPolling = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const poll = () => {
      if (document.hidden || !hasSession()) return
      dispatch(getNotifications())
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
