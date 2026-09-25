import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appInvoice/getAllData', async () => {
  const response = await axios.get('/invoices', { params: { perPage: 100 } })
  return response.data.data.invoices
})

export const getData = createAsyncThunk('appInvoice/getData', async params => {
  const response = await axios.get('/invoices', {
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
    data: response.data.data.invoices,
    allData: response.data.data.invoices,
    totalPages: response.data.data.total
  }
})

export const getInvoice = createAsyncThunk('appInvoice/getInvoice', async id => {
  const response = await axios.get(`/invoices/${id}`)
  return response.data.data
})

export const addInvoice = createAsyncThunk('appInvoice/addInvoice', async (invoice, { dispatch, getState }) => {
  try {
    const response = await axios.post('/invoices', invoice)
    await dispatch(getData(getState().invoice.params))
    await dispatch(getAllData())
    return response.data.data
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to save invoice')
  }
})

export const updateInvoice = createAsyncThunk(
  'appInvoice/updateInvoice',
  async ({ id, ...invoice }, { dispatch, getState }) => {
    try {
      const response = await axios.put(`/invoices/${id}`, invoice)
      await dispatch(getData(getState().invoice.params))
      await dispatch(getAllData())
      return response.data.data
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to save invoice')
    }
  }
)

export const deleteInvoice = createAsyncThunk('appInvoice/deleteInvoice', async (id, { dispatch, getState }) => {  try {

    await axios.delete(`/invoices/${id}`)
    await dispatch(getData(getState().invoice.params))
    await dispatch(getAllData())
    return id

  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }})

export const appInvoiceSlice = createSlice({
  name: 'appInvoice',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedInvoice: null
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
      .addCase(getInvoice.fulfilled, (state, action) => {
        state.selectedInvoice = action.payload
      })
  }
})

export default appInvoiceSlice.reducer