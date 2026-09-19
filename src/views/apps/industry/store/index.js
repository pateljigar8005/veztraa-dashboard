import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appIndustries/getAllData', async () => {
  const response = await axios.get('/industries', { params: { perPage: 100 } })
  return response.data.data.industries
})

export const getData = createAsyncThunk('appIndustries/getData', async params => {
  const response = await axios.get('/industries', {
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
    data: response.data.data.industries,
    totalPages: response.data.data.total
  }
})

export const getIndustry = createAsyncThunk('appIndustries/getIndustry', async id => {
  const response = await axios.get(`/industries/${id}`)
  return response.data.data
})

export const addIndustry = createAsyncThunk('appIndustries/addIndustry', async (industry, { dispatch, getState }) => {
  const response = await axios.post('/industries', industry)
  await dispatch(getData(getState().industries.params))
  await dispatch(getAllData())
  return response.data.data
})

export const updateIndustry = createAsyncThunk(
  'appIndustries/updateIndustry',
  async ({ id, ...industry }, { dispatch, getState }) => {
    const response = await axios.put(`/industries/${id}`, industry)
    await dispatch(getData(getState().industries.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteIndustry = createAsyncThunk('appIndustries/deleteIndustry', async (id, { dispatch, getState }) => {
  await axios.delete(`/industries/${id}`)
  await dispatch(getData(getState().industries.params))
  await dispatch(getAllData())
  return id
})

export const appIndustriesSlice = createSlice({
  name: 'appIndustries',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedIndustry: null
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
      .addCase(getIndustry.fulfilled, (state, action) => {
        state.selectedIndustry = action.payload
      })
  }
})

export default appIndustriesSlice.reducer