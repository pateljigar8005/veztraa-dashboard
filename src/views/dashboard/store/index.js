import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// blocks: keyed by the same module ids as navPermissions.js's routeToMenuId
// (invoiceApp, kanban, ...) - the server (DashboardController::summary())
// already decides which keys are present for the current user's role, so
// the UI just renders whatever came back, nothing more.
export const getSummary = createAsyncThunk('appDashboard/getSummary', async () => {
  const response = await axios.get('/dashboard/summary')
  return response.data.data
})

export const appDashboardSlice = createSlice({
  name: 'appDashboard',
  initialState: {
    blocks: {},
    upcoming: [],
    loading: true
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getSummary.pending, state => {
        state.loading = true
      })
      .addCase(getSummary.fulfilled, (state, action) => {
        state.blocks = action.payload.blocks
        state.upcoming = action.payload.upcoming
        state.loading = false
      })
      .addCase(getSummary.rejected, state => {
        state.loading = false
      })
  }
})

export default appDashboardSlice.reducer
