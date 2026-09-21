import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getData = createAsyncThunk('appActivityLogs/getData', async params => {
  const response = await axios.get('/activity-logs', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      q: params.q || '',
      sortColumn: params.sortColumn || 'created_at',
      sortDirection: params.sort || 'desc',
      entity_type: params.entityType || '',
      action: params.action || ''
    }
  })
  return {
    params,
    data: response.data.data.activityLogs,
    totalPages: response.data.data.total,
    entityTypes: response.data.data.entityTypes
  }
})

export const appActivityLogsSlice = createSlice({
  name: 'appActivityLogs',
  initialState: {
    data: [],
    total: 1,
    params: {},
    entityTypes: []
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(getData.fulfilled, (state, action) => {
      state.data = action.payload.data
      state.params = action.payload.params
      state.total = action.payload.totalPages
      state.entityTypes = action.payload.entityTypes
    })
  }
})

export default appActivityLogsSlice.reducer
