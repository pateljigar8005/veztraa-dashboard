import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appVendors/getAllData', async () => {
  const response = await axios.get('/vendors', { params: { perPage: 100 } })
  return response.data.data.vendors
})

export const getData = createAsyncThunk('appVendors/getData', async params => {
  const response = await axios.get('/vendors', {
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
    data: response.data.data.vendors,
    totalPages: response.data.data.total
  }
})

export const getVendor = createAsyncThunk('appVendors/getVendor', async id => {
  const response = await axios.get(`/vendors/${id}`)
  return response.data.data
})

export const addVendor = createAsyncThunk('appVendors/addVendor', async (vendor, { dispatch, getState }) => {
  const response = await axios.post('/vendors', vendor)
  await dispatch(getData(getState().vendors.params))
  await dispatch(getAllData())
  return response.data.data
})

export const updateVendor = createAsyncThunk(
  'appVendors/updateVendor',
  async ({ id, ...vendor }, { dispatch, getState }) => {
    const response = await axios.put(`/vendors/${id}`, vendor)
    await dispatch(getData(getState().vendors.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteVendor = createAsyncThunk('appVendors/deleteVendor', async (id, { dispatch, getState }) => {
  try {
    await axios.delete(`/vendors/${id}`)
    await dispatch(getData(getState().vendors.params))
    await dispatch(getAllData())
    return id
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }
})

export const appVendorsSlice = createSlice({
  name: 'appVendors',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedVendor: null
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
      .addCase(getVendor.fulfilled, (state, action) => {
        state.selectedVendor = action.payload
      })
  }
})

export default appVendorsSlice.reducer
