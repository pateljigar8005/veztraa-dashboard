// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appPaymentMethods/getAllData', async () => {
  const response = await axios.get('/payment-methods', { params: { perPage: 100 } })
  return response.data.data.paymentMethods
})

export const getData = createAsyncThunk('appPaymentMethods/getData', async params => {
  const response = await axios.get('/payment-methods', {
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
    data: response.data.data.paymentMethods,
    totalPages: response.data.data.total
  }
})

export const getPaymentMethod = createAsyncThunk('appPaymentMethods/getPaymentMethod', async id => {
  const response = await axios.get(`/payment-methods/${id}`)
  return response.data.data
})

export const addPaymentMethod = createAsyncThunk(
  'appPaymentMethods/addPaymentMethod',
  async (paymentMethod, { dispatch, getState }) => {
    const response = await axios.post('/payment-methods', paymentMethod)
    await dispatch(getData(getState().paymentMethods.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updatePaymentMethod = createAsyncThunk(
  'appPaymentMethods/updatePaymentMethod',
  async ({ id, ...paymentMethod }, { dispatch, getState }) => {
    const response = await axios.put(`/payment-methods/${id}`, paymentMethod)
    await dispatch(getData(getState().paymentMethods.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deletePaymentMethod = createAsyncThunk(
  'appPaymentMethods/deletePaymentMethod',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/payment-methods/${id}`)
    await dispatch(getData(getState().paymentMethods.params))
    await dispatch(getAllData())
    return id
  }
)

export const appPaymentMethodsSlice = createSlice({
  name: 'appPaymentMethods',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedPaymentMethod: null
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
      .addCase(getPaymentMethod.fulfilled, (state, action) => {
        state.selectedPaymentMethod = action.payload
      })
  }
})

export default appPaymentMethodsSlice.reducer
