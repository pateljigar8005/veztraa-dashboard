// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appCurrencies/getAllData', async () => {
  const response = await axios.get('/currencies', { params: { perPage: 100 } })
  return response.data.data.currencies
})

export const getData = createAsyncThunk('appCurrencies/getData', async params => {
  const response = await axios.get('/currencies', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      q: params.q || ''
    }
  })
  return {
    params,
    data: response.data.data.currencies,
    totalPages: response.data.data.total
  }
})

export const getCurrency = createAsyncThunk('appCurrencies/getCurrency', async id => {
  const response = await axios.get(`/currencies/${id}`)
  return response.data.data
})

export const addCurrency = createAsyncThunk('appCurrencies/addCurrency', async (currency, { dispatch, getState }) => {
  const response = await axios.post('/currencies', currency)
  await dispatch(getData(getState().currencies.params))
  await dispatch(getAllData())
  return response.data.data
})

export const updateCurrency = createAsyncThunk(
  'appCurrencies/updateCurrency',
  async ({ id, ...currency }, { dispatch, getState }) => {
    const response = await axios.put(`/currencies/${id}`, currency)
    await dispatch(getData(getState().currencies.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteCurrency = createAsyncThunk(
  'appCurrencies/deleteCurrency',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/currencies/${id}`)
    await dispatch(getData(getState().currencies.params))
    await dispatch(getAllData())
    return id
  }
)

export const appCurrenciesSlice = createSlice({
  name: 'appCurrencies',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedCurrency: null
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
      .addCase(getCurrency.fulfilled, (state, action) => {
        state.selectedCurrency = action.payload
      })
  }
})

export default appCurrenciesSlice.reducer
