import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// Backs the navbar notification bell (NotificationDropdown.js) and the
// Contact Us/Job Applications sidebar unread badges
// (VerticalNavMenuLink.js's UNREAD_SELECTORS, reading `byType`) - the API
// already permission-gates and own-records-scopes everything in the
// response (see NotificationController::index()), so this just stores
// whatever comes back.
export const getNotifications = createAsyncThunk('notifications/getNotifications', async () => {
  const response = await axios.get('/notifications')
  return response.data.data
})

// Clears one item - a real is_read flag for contact/job_application, a
// NotificationDismissal row (fingerprinted to its current due_date) for
// todo_overdue, and an outright delete for a mention (see
// NotificationController::dismiss()/CommentMention::deleteForUser()'s own
// note on why a mention has nothing else worth keeping around once cleared).
// Re-fetches so the badge count/list reflect it immediately.
export const dismissNotification = createAsyncThunk(
  'notifications/dismissNotification',
  async ({ type, id }, { dispatch }) => {
    await axios.post('/notifications/dismiss', { type, id })
    await dispatch(getNotifications())
  }
)

// Opening a mention to actually look at it - distinct from dismiss above:
// this only clears the unread badge, it never removes the item from the
// list (see NotificationController::markRead()). Only 'mention' has this
// three-state read-but-still-shown/cleared distinction today.
export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async ({ type, id }, { dispatch }) => {
    await axios.post('/notifications/read', { type, id })
    await dispatch(getNotifications())
  }
)

// "Mark all as read" in the bell's header - flags everything read the same
// way dismissAllNotifications below does, EXCEPT a mention: this only clears
// its unread badge, it stays visible (muted) until an explicit Clear all
// (see NotificationController::markAllRead()'s own note).
export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllNotificationsRead',
  async (_, { dispatch }) => {
    await axios.post('/notifications/mark-all-read')
    await dispatch(getNotifications())
  }
)

// "Clear all" in the bell's header - removes every notification this caller
// can currently see for good, not just the 5-per-type slice the dropdown
// renders (see NotificationController::dismissAll()).
export const dismissAllNotifications = createAsyncThunk(
  'notifications/dismissAllNotifications',
  async (_, { dispatch }) => {
    await axios.post('/notifications/dismiss-all')
    await dispatch(getNotifications())
  }
)

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    count: 0,
    byType: { contact: 0, job_application: 0, mention: 0 },
    items: []
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(getNotifications.fulfilled, (state, action) => {
      state.count = action.payload.count
      state.byType = action.payload.byType
      state.items = action.payload.items
    })
  }
})

export default notificationsSlice.reducer
