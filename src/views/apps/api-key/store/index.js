import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appApiKeys/getAllData', async () => {
  const response = await axios.get('/api-tokens')
  return response.data.data.apiTokens
})

// The raw secret is only ever present in this thunk's own resolved value -
// deliberately not written into slice state (see extraReducers below) so it
// can't resurface later via Redux devtools or a refetch. The caller
// (CreateApiKeyModal) must read it directly off the `.unwrap()` result.
export const addApiKey = createAsyncThunk('appApiKeys/addApiKey', async (payload, { dispatch }) => {
  const response = await axios.post('/api-tokens', payload)
  await dispatch(getAllData())
  return response.data.data
})

export const toggleApiKey = createAsyncThunk('appApiKeys/toggleApiKey', async (id, { dispatch }) => {
  try {
    await axios.post(`/api-tokens/${id}/toggle`)
    await dispatch(getAllData())
    return id
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to update API key')
  }
})

export const deleteApiKey = createAsyncThunk('appApiKeys/deleteApiKey', async (id, { dispatch }) => {
  try {
    await axios.delete(`/api-tokens/${id}`)
    await dispatch(getAllData())
    return id
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }
})

export const getApiKeyLogs = createAsyncThunk('appApiKeys/getApiKeyLogs', async ({ id, page = 1, perPage = 10 }) => {
  const response = await axios.get(`/api-tokens/${id}/logs`, { params: { page, perPage } })
  return {
    id,
    page,
    perPage,
    data: response.data.data.logs,
    total: response.data.data.total
  }
})

// Refetching afterward is left to the caller (it knows the page/perPage
// currently on screen), rather than guessed here with different defaults.
export const clearApiKeyLogs = createAsyncThunk('appApiKeys/clearApiKeyLogs', async id => {
  try {
    await axios.delete(`/api-tokens/${id}/logs`)
    return id
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to clear access history')
  }
})

export const appApiKeysSlice = createSlice({
  name: 'appApiKeys',
  initialState: {
    allData: [],
    logs: { id: null, data: [], total: 1, page: 1, perPage: 10 }
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getAllData.fulfilled, (state, action) => {
        state.allData = action.payload
      })
      .addCase(getApiKeyLogs.fulfilled, (state, action) => {
        state.logs = action.payload
      })
  }
})

export default appApiKeysSlice.reducer
