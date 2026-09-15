// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appQuotations/getAllData', async () => {
  const response = await axios.get('/quotations', { params: { perPage: 100 } })
  return response.data.data.quotations
})

export const getData = createAsyncThunk('appQuotations/getData', async params => {
  const response = await axios.get('/quotations', {
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
    data: response.data.data.quotations,
    totalPages: response.data.data.total
  }
})

export const getQuotation = createAsyncThunk('appQuotations/getQuotation', async id => {
  const response = await axios.get(`/quotations/${id}`)
  return response.data.data
})

export const addQuotation = createAsyncThunk(
  'appQuotations/addQuotation',
  async (quotation, { dispatch, getState }) => {
    const response = await axios.post('/quotations', quotation)
    await dispatch(getData(getState().quotations.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updateQuotation = createAsyncThunk(
  'appQuotations/updateQuotation',
  async ({ id, ...quotation }, { dispatch, getState }) => {
    const response = await axios.put(`/quotations/${id}`, quotation)
    await dispatch(getData(getState().quotations.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteQuotation = createAsyncThunk(
  'appQuotations/deleteQuotation',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/quotations/${id}`)
    await dispatch(getData(getState().quotations.params))
    await dispatch(getAllData())
    return id
  }
)

export const appQuotationsSlice = createSlice({
  name: 'appQuotations',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedQuotation: null
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
      .addCase(getQuotation.fulfilled, (state, action) => {
        state.selectedQuotation = action.payload
      })
  }
})

export default appQuotationsSlice.reducer
