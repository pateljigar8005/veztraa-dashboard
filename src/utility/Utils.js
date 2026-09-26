import { DefaultRoute } from '../router/routes'
import axios from 'axios'
import { resizeToFit, uploadToR2 } from './imageUpload'

export const isObjEmpty = obj => Object.keys(obj).length === 0

// A-Z by label for react-select `options` arrays built from a real record
// list (clients, users, templates, ...) - deliberately NOT used on a small
// fixed-choice list (priority/status/frequency/discount type) where the
// existing order is itself meaningful, not incidental.
export const sortOptions = options => [...options].sort((a, b) => String(a.label).localeCompare(String(b.label)))

// Label for a client in a select: "Name (Company)" so clients that share a name
// can be told apart. Falls back to just the name when there is no company.
export const clientOptionLabel = client => {
  const name = client.fullName || [client.first_name, client.last_name].filter(Boolean).join(' ')
  return client.company_name ? `${name} (${client.company_name})` : name
}

// R2-hosted images come back as an already-absolute URL (custom domain);
// only a legacy pre-R2 relative path (e.g. "/public/avatars/xxx.jpg") needs
// the API base URL prefixed.
export const resolveAvatarUrl = path => {
  if (!path) return null
  return /^https?:\/\//i.test(path) ? path : `${axios.defaults.baseURL}${path}`
}

// Uploads straight to R2 (see src/utility/imageUpload.js) - the API never
// receives the file, only mints the presigned URL.
export const uploadEditorImage = async file => uploadToR2('editor', await resizeToFit(file))

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

// The real profile picture to show for a mail row/header, when the API has
// attached one (see MessageAvatarEnricher on the backend - it only attaches
// avatarUrl when the address is one of our own Users with a picture
// uploaded, so most mail simply won't have one and the caller falls back to
// initials). Matches whichever party displayName/correspondentName already
// shows: the sender for a received message, or the first recipient for a
// Sent/Scheduled one.
export const correspondentAvatarUrl = (mail, isSent) => {
  if (isSent) {
    return mail?.to?.[0]?.avatarUrl || null
  }
  return mail?.from?.avatarUrl || null
}

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