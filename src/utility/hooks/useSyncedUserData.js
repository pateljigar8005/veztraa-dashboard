// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import axios from 'axios'

const readUserData = () => {
  try {
    return JSON.parse(localStorage.getItem('userData'))
  } catch (e) {
    return null
  }
}

// The login response is the only place userData (role, permissions, ability)
// ever gets written to localStorage - once a user is logged in, editing their
// role's permissions in Roles & Permissions has no effect for them until they
// log out and back in, even across a hard reload, since the cached copy is
// never re-fetched. This refreshes it from /auth/me once per mount (i.e. once
// per page load, since the layout that calls this stays mounted across
// client-side navigation) so a role change takes effect on the user's next
// reload instead of requiring a fresh login.
export const useSyncedUserData = () => {
  const [userData, setUserData] = useState(readUserData)

  useEffect(() => {
    if (!userData) return

    axios
      .get('/auth/me')
      .then(response => {
        const fresh = response.data?.data
        if (!fresh) return
        const merged = { ...userData, ...fresh }
        localStorage.setItem('userData', JSON.stringify(merged))
        setUserData(merged)
      })
      .catch(() => {
        // Keep using the last-known cached copy (offline, token expiry mid-flow, etc).
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return userData
}
