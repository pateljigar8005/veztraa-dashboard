import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appJobListings/getAllData', async () => {
  const response = await axios.get('/job-listings', { params: { perPage: 100 } })
  return response.data.data.jobListings
})

export const getData = createAsyncThunk('appJobListings/getData', async params => {
  const response = await axios.get('/job-listings', {
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
    data: response.data.data.jobListings,
    totalPages: response.data.data.total
  }
})

export const getJobListing = createAsyncThunk('appJobListings/getJobListing', async id => {
  const response = await axios.get(`/job-listings/${id}`)
  return response.data.data
})

export const addJobListing = createAsyncThunk(
  'appJobListings/addJobListing',
  async (item, { dispatch, getState }) => {
    const response = await axios.post('/job-listings', item)
    await dispatch(getData(getState().jobListings.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updateJobListing = createAsyncThunk(
  'appJobListings/updateJobListing',
  async ({ id, ...item }, { dispatch, getState }) => {
    const response = await axios.put(`/job-listings/${id}`, item)
    await dispatch(getData(getState().jobListings.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteJobListing = createAsyncThunk(
  'appJobListings/deleteJobListing',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/job-listings/${id}`)
    await dispatch(getData(getState().jobListings.params))
    await dispatch(getAllData())
    return id
  }
)

export const appJobListingsSlice = createSlice({
  name: 'appJobListings',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedJobListing: null
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
      .addCase(getJobListing.fulfilled, (state, action) => {
        state.selectedJobListing = action.payload
      })
  }
})

export default appJobListingsSlice.reducer