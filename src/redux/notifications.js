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
// todo_overdue (see NotificationController::dismiss()).
// Re-fetches so the badge count/list reflect it immediately.
export const dismissNotification = createAsyncThunk(
  'notifications/dismissNotification',
  async ({ type, id }, { dispatch }) => {
    await axios.post('/notifications/dismiss', { type, id })
    await dispatch(getNotifications())
  }
)

// "Mark all as read" / "Clear" in the bell's header - dismisses every
// notification this caller can currently see, not just the 5-per-type
// slice the dropdown renders (see NotificationController::dismissAll()).
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
    byType: { contact: 0, job_application: 0 },
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
