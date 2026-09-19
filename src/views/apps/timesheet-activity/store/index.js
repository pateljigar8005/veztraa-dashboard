import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appTimesheetActivities/getAllData', async () => {
  const response = await axios.get('/timesheet-activities', { params: { perPage: 100 } })
  return response.data.data.timesheetActivities
})

export const getData = createAsyncThunk('appTimesheetActivities/getData', async params => {
  const response = await axios.get('/timesheet-activities', {
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
    data: response.data.data.timesheetActivities,
    totalPages: response.data.data.total
  }
})

export const getTimesheetActivity = createAsyncThunk('appTimesheetActivities/getTimesheetActivity', async id => {
  const response = await axios.get(`/timesheet-activities/${id}`)
  return response.data.data
})

export const addTimesheetActivity = createAsyncThunk(
  'appTimesheetActivities/addTimesheetActivity',
  async (activity, { dispatch, getState }) => {
    const response = await axios.post('/timesheet-activities', activity)
    await dispatch(getData(getState().timesheetActivities.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updateTimesheetActivity = createAsyncThunk(
  'appTimesheetActivities/updateTimesheetActivity',
  async ({ id, ...activity }, { dispatch, getState }) => {
    const response = await axios.put(`/timesheet-activities/${id}`, activity)
    await dispatch(getData(getState().timesheetActivities.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteTimesheetActivity = createAsyncThunk(
  'appTimesheetActivities/deleteTimesheetActivity',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/timesheet-activities/${id}`)
    await dispatch(getData(getState().timesheetActivities.params))
    await dispatch(getAllData())
    return id
  }
)

export const appTimesheetActivitiesSlice = createSlice({
  name: 'appTimesheetActivities',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedTimesheetActivity: null
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
      .addCase(getTimesheetActivity.fulfilled, (state, action) => {
        state.selectedTimesheetActivity = action.payload
      })
  }
})

export default appTimesheetActivitiesSlice.reducer