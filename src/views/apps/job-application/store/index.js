import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appJobApplications/getAllData', async () => {
  const response = await axios.get('/job-applications', { params: { perPage: 100 } })
  return response.data.data.jobApplications
})

export const getData = createAsyncThunk('appJobApplications/getData', async params => {
  const response = await axios.get('/job-applications', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      q: params.q || '',
      sortColumn: params.sortColumn || 'created_at',
      sortDirection: params.sort || 'desc'
    }
  })
  return {
    params,
    data: response.data.data.jobApplications,
    totalPages: response.data.data.total
  }
})

// Marks the application read server-side (see JobApplicationController::show()),
// clearing its "New" badge in the list once viewed.
export const getJobApplication = createAsyncThunk('appJobApplications/getJobApplication', async id => {
  const response = await axios.get(`/job-applications/${id}`)
  return response.data.data
})

export const deleteJobApplication = createAsyncThunk(
  'appJobApplications/deleteJobApplication',
  async (id, { dispatch, getState }) => {
    try {
      await axios.delete(`/job-applications/${id}`)
      await dispatch(getData(getState().jobApplications.params))
      await dispatch(getAllData())
      return id
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to delete')
    }
  }
)

export const appJobApplicationsSlice = createSlice({
  name: 'appJobApplications',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedJobApplication: null
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
      .addCase(getJobApplication.fulfilled, (state, action) => {
        state.selectedJobApplication = action.payload
      })
  }
})

export default appJobApplicationsSlice.reducer
