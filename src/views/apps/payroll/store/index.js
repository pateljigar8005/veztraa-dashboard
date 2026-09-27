import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getData = createAsyncThunk('appPayroll/getData', async params => {
  const response = await axios.get('/payroll-runs', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10
    }
  })
  return {
    params,
    data: response.data.data.payroll_runs,
    totalPages: response.data.data.total
  }
})

export const getPayrollRun = createAsyncThunk('appPayroll/getPayrollRun', async id => {
  const response = await axios.get(`/payroll-runs/${id}`)
  return response.data.data
})

export const generatePayroll = createAsyncThunk(
  'appPayroll/generatePayroll',
  async ({ month, year }, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await axios.post('/payroll-runs/generate', { month, year })
      await dispatch(getData(getState().payroll.params))
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const finalizePayrollRun = createAsyncThunk(
  'appPayroll/finalizePayrollRun',
  async id => {
    const response = await axios.post(`/payroll-runs/${id}/finalize`)
    return response.data.data
  }
)

export const markPayslipPaid = createAsyncThunk(
  'appPayroll/markPayslipPaid',
  async id => {
    const response = await axios.post(`/payslips/${id}/mark-paid`)
    return response.data.data
  }
)

export const appPayrollSlice = createSlice({
  name: 'appPayroll',
  initialState: {
    data: [],
    total: 1,
    params: {},
    selectedRun: null,
    payslips: []
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getData.fulfilled, (state, action) => {
        state.data = action.payload.data
        state.params = action.payload.params
        state.total = action.payload.totalPages
      })
      .addCase(getPayrollRun.fulfilled, (state, action) => {
        state.selectedRun = action.payload.payroll_run
        state.payslips = action.payload.payslips
      })
      .addCase(generatePayroll.fulfilled, (state, action) => {
        state.selectedRun = action.payload.payroll_run
        state.payslips = action.payload.payslips
      })
      .addCase(finalizePayrollRun.fulfilled, (state, action) => {
        if (state.selectedRun) {
          state.selectedRun = action.payload
        }
      })
      .addCase(markPayslipPaid.fulfilled, (state, action) => {
        state.payslips = state.payslips.map(p => (p.id === action.payload.id ? action.payload : p))
      })
  }
})

export default appPayrollSlice.reducer
