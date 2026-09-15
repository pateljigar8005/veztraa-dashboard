// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appTimesheets/getAllData', async () => {
  const response = await axios.get('/timesheets', { params: { perPage: 100 } })
  return response.data.data.timesheets
})

export const getData = createAsyncThunk('appTimesheets/getData', async params => {
  const response = await axios.get('/timesheets', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      q: params.q || '',
      sortColumn: params.sortColumn || 'id',
      sortDirection: params.sort || 'desc',
      ...params.filters
    }
  })
  return {
    params,
    data: response.data.data.timesheets,
    totalPages: response.data.data.total
  }
})

export const getTimesheet = createAsyncThunk('appTimesheets/getTimesheet', async id => {
  const response = await axios.get(`/timesheets/${id}`)
  return response.data.data
})

export const addTimesheet = createAsyncThunk('appTimesheets/addTimesheet', async (timesheet, { dispatch, getState }) => {
  const response = await axios.post('/timesheets', timesheet)
  await dispatch(getData(getState().timesheets.params))
  await dispatch(getAllData())
  return response.data.data
})

export const updateTimesheet = createAsyncThunk(
  'appTimesheets/updateTimesheet',
  async ({ id, ...timesheet }, { dispatch, getState }) => {
    const response = await axios.put(`/timesheets/${id}`, timesheet)
    await dispatch(getData(getState().timesheets.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteTimesheet = createAsyncThunk('appTimesheets/deleteTimesheet', async (id, { dispatch, getState }) => {
  await axios.delete(`/timesheets/${id}`)
  await dispatch(getData(getState().timesheets.params))
  await dispatch(getAllData())
  return id
})

export const appTimesheetsSlice = createSlice({
  name: 'appTimesheets',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedTimesheet: null
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
      .addCase(getTimesheet.fulfilled, (state, action) => {
        state.selectedTimesheet = action.payload
      })
  }
})

export default appTimesheetsSlice.reducer
