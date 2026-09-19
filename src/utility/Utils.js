import { DefaultRoute } from '../router/routes'
import axios from 'axios'

export const isObjEmpty = obj => Object.keys(obj).length === 0

export const resolveAvatarUrl = path => (path ? `${axios.defaults.baseURL}${path}` : null)

export const uploadEditorImage = async file => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await axios.post('/uploads/image', formData)
  return resolveAvatarUrl(response.data.data.url)
}

export const kFormatter = num => (num > 999 ? `${(num / 1000).toFixed(1)}k` : num)

export const formatAmount = value => {
  const num = Number(value)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const htmlToString = html => html.replace(/<\/?[^>]+(>|$)/g, '')

export const toDateOnly = date => {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const isToday = date => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export const formatDate = (value, formatting = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!value) return value
  return new Intl.DateTimeFormat('en-US', formatting).format(new Date(value))
}

export const formatDateToMonthShort = (value, toTimeForCurrentDay = true) => {
  const date = new Date(value)
  let formatting = { month: 'short', day: 'numeric' }

  if (toTimeForCurrentDay && isToday(date)) {
    formatting = { hour: 'numeric', minute: 'numeric' }
  }

  return new Intl.DateTimeFormat('en-US', formatting).format(new Date(value))
}

export const formatRelativeDate = value => {
  const date = new Date(value)
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const isFuture = diffSeconds < 0
  const absSeconds = Math.abs(diffSeconds)

  if (absSeconds < 60) return 'Just now'
  if (absSeconds < 3600) {
    const mins = Math.floor(absSeconds / 60)
    return isFuture ? `in ${mins} min${mins === 1 ? '' : 's'}` : `${mins} min${mins === 1 ? '' : 's'} ago`
  }
  if (absSeconds < 86400 && isToday(date)) {
    const hours = Math.floor(absSeconds / 3600)
    return isFuture ? `in ${hours} hour${hours === 1 ? '' : 's'}` : `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  return formatDateToMonthShort(value)
}

// Avatar's `initials` mode takes one letter from EVERY word, so a long name
// overflows the circle - keep only the first two words that have a letter.
export const initialsSource = (name, max = 2) =>
  String(name || '')
    .split(' ')
    .filter(word => /[a-zA-Z]/.test(word))
    .slice(0, max)
    .join(' ')

export const formatRecipients = to =>
  (Array.isArray(to) ? to : [])
    .map(r => (typeof r === 'string' ? r : r?.name || r?.email || ''))
    .filter(Boolean)
    .join(', ')

export const isUserLoggedIn = () => localStorage.getItem('userData')
export const getUserData = () => JSON.parse(localStorage.getItem('userData'))

export const getHomeRouteForLoggedInUser = userRole => {
  return userRole ? DefaultRoute : '/login'
}

export const selectThemeColors = theme => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary25: '#7367f01a',
    primary: '#7367f0',
    neutral10: '#7367f0',
    neutral20: '#ededed',
    neutral30: '#ededed'
  }
})