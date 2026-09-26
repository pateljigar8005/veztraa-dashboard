import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// One slice for the whole Leave module (balances, requests, overtime) -
// they're always read/mutated together on the My Leave and Leave
// Approvals pages, so a single store avoids three near-identical slices.

export const getMyBalances = createAsyncThunk('appLeave/getMyBalances', async (params = {}) => {
  const response = await axios.get('/leave-balances', { params })
  return response.data.data
})

export const adjustBalance = createAsyncThunk(
  'appLeave/adjustBalance',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post('/leave-balances/adjust', payload)
      await dispatch(getMyBalances({ user_id: payload.user_id, year: payload.year }))
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const getMyLeaveRequests = createAsyncThunk('appLeave/getMyLeaveRequests', async (params = {}) => {
  const response = await axios.get('/leave-requests', { params: { perPage: 50, ...params } })
  return response.data.data
})

export const getPendingLeaveRequests = createAsyncThunk('appLeave/getPendingLeaveRequests', async () => {
  const response = await axios.get('/leave-requests', { params: { status: 'pending', perPage: 100 } })
  return response.data.data
})

export const addLeaveRequest = createAsyncThunk(
  'appLeave/addLeaveRequest',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post('/leave-requests', payload)
      await dispatch(getMyLeaveRequests())
      await dispatch(getMyBalances())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const updateLeaveRequest = createAsyncThunk(
  'appLeave/updateLeaveRequest',
  async ({ id, ...payload }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.put(`/leave-requests/${id}`, payload)
      await dispatch(getMyLeaveRequests())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const approveLeaveRequest = createAsyncThunk(
  'appLeave/approveLeaveRequest',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`/leave-requests/${id}/approve`)
      await dispatch(getPendingLeaveRequests())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const rejectLeaveRequest = createAsyncThunk(
  'appLeave/rejectLeaveRequest',
  async ({ id, rejection_reason }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`/leave-requests/${id}/reject`, { rejection_reason })
      await dispatch(getPendingLeaveRequests())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const cancelLeaveRequest = createAsyncThunk(
  'appLeave/cancelLeaveRequest',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`/leave-requests/${id}/cancel`)
      await dispatch(getMyLeaveRequests())
      await dispatch(getMyBalances())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const getMyOvertimeEntries = createAsyncThunk('appLeave/getMyOvertimeEntries', async (params = {}) => {
  const response = await axios.get('/overtime-entries', { params })
  return response.data.data.overtime_entries
})

export const getPendingOvertimeEntries = createAsyncThunk('appLeave/getPendingOvertimeEntries', async () => {
  const response = await axios.get('/overtime-entries', { params: { status: 'pending' } })
  return response.data.data.overtime_entries
})

export const addOvertimeEntry = createAsyncThunk(
  'appLeave/addOvertimeEntry',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post('/overtime-entries', payload)
      await dispatch(getMyOvertimeEntries())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const approveOvertimeEntry = createAsyncThunk(
  'appLeave/approveOvertimeEntry',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`/overtime-entries/${id}/approve`)
      await dispatch(getPendingOvertimeEntries())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const rejectOvertimeEntry = createAsyncThunk(
  'appLeave/rejectOvertimeEntry',
  async id => {
    try {
      const response = await axios.post(`/overtime-entries/${id}/reject`)
      return response.data.data
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to reject overtime entry')
    }
  }
)

export const appLeaveSlice = createSlice({
  name: 'appLeave',
  initialState: {
    balances: [],
    balancesYear: new Date().getFullYear(),
    myRequests: [],
    myRequestsTotal: 0,
    pendingRequests: [],
    myOvertimeEntries: [],
    pendingOvertimeEntries: []
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getMyBalances.fulfilled, (state, action) => {
        state.balances = action.payload.balances
        state.balancesYear = action.payload.year
      })
      .addCase(getMyLeaveRequests.fulfilled, (state, action) => {
        state.myRequests = action.payload.leave_requests
        state.myRequestsTotal = action.payload.total
      })
      .addCase(getPendingLeaveRequests.fulfilled, (state, action) => {
        state.pendingRequests = action.payload.leave_requests
      })
      .addCase(getMyOvertimeEntries.fulfilled, (state, action) => {
        state.myOvertimeEntries = action.payload
      })
      .addCase(getPendingOvertimeEntries.fulfilled, (state, action) => {
        state.pendingOvertimeEntries = action.payload
      })
  }
})

export default appLeaveSlice.reducer
