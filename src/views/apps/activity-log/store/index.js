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

export const deleteActivityLog = createAsyncThunk('appActivityLogs/deleteActivityLog', async (id, { dispatch, getState }) => {
  try {
    await axios.delete(`/activity-logs/${id}`)
    await dispatch(getData(getState().activityLogs.params))
    return id
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }
})

export const bulkDeleteActivityLogs = createAsyncThunk('appActivityLogs/bulkDeleteActivityLogs', async (ids, { dispatch, getState }) => {
  try {
    const response = await axios.post('/activity-logs/bulk-delete', { ids })
    await dispatch(getData(getState().activityLogs.params))
    return response.data.data.deleted
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }
})

export const appActivityLogsSlice = createSlice({
  name: 'appActivityLogs',
  initialState: {
    data: [],
    total: 1,
    params: {},
    entityTypes: [],
    // Rows ticked on the list page - lives here rather than in Table.js's
    // own state so the navbar's bulk-delete icon (NavbarBookmarks.js) can
    // read the count too.
    selectedIds: []
  },
  reducers: {
    setSelectedIds: (state, action) => {
      state.selectedIds = action.payload
    }
  },
  extraReducers: builder => {
    builder.addCase(getData.fulfilled, (state, action) => {
      state.data = action.payload.data
      state.params = action.payload.params
      state.total = action.payload.totalPages
      state.entityTypes = action.payload.entityTypes
      // A fresh page of rows never has anything ticked yet.
      state.selectedIds = []
    })
  }
})

export const { setSelectedIds } = appActivityLogsSlice.actions

export default appActivityLogsSlice.reducer
