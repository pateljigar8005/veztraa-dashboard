import { useEffect, useState } from 'react'
import axios from 'axios'

const readUserData = () => {
  try {
    return JSON.parse(localStorage.getItem('userData'))
  } catch (e) {
    return null
  }
}

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
      })
  }, [])

  return userData
}