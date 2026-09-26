import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appLeaveTypes/getAllData', async () => {
  const response = await axios.get('/leave-types', { params: { perPage: 100 } })
  return response.data.data.leave_types
})

export const getData = createAsyncThunk('appLeaveTypes/getData', async params => {
  const response = await axios.get('/leave-types', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      q: params.q || '',
      sortColumn: params.sortColumn || 'name',
      sortDirection: params.sort || 'asc',
      ...params.filters
    }
  })
  return {
    params,
    data: response.data.data.leave_types,
    totalPages: response.data.data.total
  }
})

export const getLeaveType = createAsyncThunk('appLeaveTypes/getLeaveType', async id => {
  const response = await axios.get(`/leave-types/${id}`)
  return response.data.data
})

export const addLeaveType = createAsyncThunk(
  'appLeaveTypes/addLeaveType',
  async (leaveType, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await axios.post('/leave-types', leaveType)
      await dispatch(getData(getState().leaveTypes.params))
      await dispatch(getAllData())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const updateLeaveType = createAsyncThunk(
  'appLeaveTypes/updateLeaveType',
  async ({ id, ...leaveType }, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await axios.put(`/leave-types/${id}`, leaveType)
      await dispatch(getData(getState().leaveTypes.params))
      await dispatch(getAllData())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const deleteLeaveType = createAsyncThunk(
  'appLeaveTypes/deleteLeaveType',
  async (id, { dispatch, getState }) => {
    try {
      await axios.delete(`/leave-types/${id}`)
      await dispatch(getData(getState().leaveTypes.params))
      await dispatch(getAllData())
      return id
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to delete')
    }
  }
)

export const appLeaveTypesSlice = createSlice({
  name: 'appLeaveTypes',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedLeaveType: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getAllData.fulfilled, (state, action) => {
        state.allData = action.payload
      })
      .addCase(getData.fulfilled, (state, action) => {
        state.data = action.payload.data
        state.params = action.payload.params
        state.total = action.payload.totalPages
      })
      .addCase(getLeaveType.fulfilled, (state, action) => {
        state.selectedLeaveType = action.payload
      })
  }
})

export default appLeaveTypesSlice.reducer
