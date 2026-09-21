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
