import { DefaultRoute } from '../router/routes'
import axios from 'axios'

// ** Checks if an object is empty (returns boolean)
export const isObjEmpty = obj => Object.keys(obj).length === 0

// ** Uploaded avatars/documents are stored as API-relative paths (e.g.
// "/uploads/avatars/xxx.jpg") - resolve them against the API base URL so
// <img> tags don't request them from the dashboard's own origin instead.
export const resolveAvatarUrl = path => (path ? `${axios.defaults.baseURL}${path}` : null)

// ** @veztraa/editor's onImageUpload prop (a dropped/pasted/picked image ->
// a real hosted URL, instead of the editor's own default of inlining it as
// base64 or a client-side blob: URL that dies once the tab closes) - every
// Editor instance across the app passes this same handler (see
// UploadController::image() on the API side) so an embedded image survives
// a page reload and is never duplicated as base64 inside the stored HTML.
export const uploadEditorImage = async file => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await axios.post('/uploads/image', formData)
  return resolveAvatarUrl(response.data.data.url)
}

// ** Returns K format from a number
export const kFormatter = num => (num > 999 ? `${(num / 1000).toFixed(1)}k` : num)

// ** Formats a money amount with thousand separators and 2 decimals
// (1250000.5 -> '1,250,000.50') - the display-side counterpart to AmountField
// (masked input) for every list/table column that shows a raw money value.
export const formatAmount = value => {
  const num = Number(value)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ** Converts HTML to string
export const htmlToString = html => html.replace(/<\/?[^>]+(>|$)/g, '')

// ** Turns a Flatpickr-selected Date into a plain 'YYYY-MM-DD' string using
// local getters, not toISOString() (which is UTC and can shift a day
// depending on the browser's timezone) - every date-only field in this app
// stores/sends this format, so no further conversion is needed anywhere else.
export const toDateOnly = date => {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ** Checks if the passed date is today
const isToday = date => {
  const today = new Date()
  return (
    /* eslint-disable operator-linebreak */
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
    /* eslint-enable */
  )
}

/**
 ** Format and return date in Humanize format
 ** Intl docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/format
 ** Intl Constructor: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
 * @param {String} value date to format
 * @param {Object} formatting Intl object to format with
 */
export const formatDate = (value, formatting = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!value) return value
  return new Intl.DateTimeFormat('en-US', formatting).format(new Date(value))
}

// ** Returns short month of passed date
export const formatDateToMonthShort = (value, toTimeForCurrentDay = true) => {
  const date = new Date(value)
  let formatting = { month: 'short', day: 'numeric' }

  if (toTimeForCurrentDay && isToday(date)) {
    formatting = { hour: 'numeric', minute: 'numeric' }
  }

  return new Intl.DateTimeFormat('en-US', formatting).format(new Date(value))
}

// ** Relative time ("Just now" / "5 mins ago" / "3 hours ago") for anything
// within the last 24h, falling back to formatDateToMonthShort beyond that -
// matches Gmail's own list behavior of only using relative time for recent items.
export const formatRelativeDate = value => {
  const date = new Date(value)
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diffSeconds < 60) return 'Just now'
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60)
    return `${mins} min${mins === 1 ? '' : 's'} ago`
  }
  if (diffSeconds < 86400 && isToday(date)) {
    const hours = Math.floor(diffSeconds / 3600)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  return formatDateToMonthShort(value)
}

// ** A mail's `to` list is shaped inconsistently depending on where it came
// from: regular synced folders and live IMAP fetches use {name, email}
// objects (see Mailbox::addressToArray()), but a Sent-folder cache row
// written right after composing stores plain email strings instead (see
// MailboxOutbox::processOne() / MailboxController::splitAddresses()) -
// handles both shapes rather than assuming one.
export const formatRecipients = to =>
  (Array.isArray(to) ? to : [])
    .map(r => (typeof r === 'string' ? r : r?.name || r?.email || ''))
    .filter(Boolean)
    .join(', ')

/**
 ** Return if user is logged in
 ** This is completely up to you and how you want to store the token in your frontend application
 *  ? e.g. If you are using cookies to store the application please update this function
 */
export const isUserLoggedIn = () => localStorage.getItem('userData')
export const getUserData = () => JSON.parse(localStorage.getItem('userData'))

/**
 ** This function is used for demo purpose route navigation
 ** In real app you won't need this function because your app will navigate to same route for each users regardless of ability
 ** Please note role field is just for showing purpose it's not used by anything in frontend
 ** We are checking role just for ease
 * ? NOTE: If you have different pages to navigate based on user ability then this function can be useful. However, you need to update it.
 * @param {String} userRole Role of user
 */
export const getHomeRouteForLoggedInUser = userRole => {
  return userRole ? DefaultRoute : '/login'
}

// ** React Select Theme Colors
export const selectThemeColors = theme => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary25: '#7367f01a', // for option hover bg-color
    primary: '#7367f0', // for selected option bg-color
    neutral10: '#7367f0', // for tags bg-color
    neutral20: '#ededed', // for input border-color
    neutral30: '#ededed' // for input hover border-color
  }
})
