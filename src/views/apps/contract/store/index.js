// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appContracts/getAllData', async () => {
  const response = await axios.get('/contracts', { params: { perPage: 100 } })
  return response.data.data.contracts
})

export const getData = createAsyncThunk('appContracts/getData', async params => {
  const response = await axios.get('/contracts', {
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
    data: response.data.data.contracts,
    totalPages: response.data.data.total
  }
})

export const getContract = createAsyncThunk('appContracts/getContract', async id => {
  const response = await axios.get(`/contracts/${id}`)
  return response.data.data
})

export const addContract = createAsyncThunk(
  'appContracts/addContract',
  async ({ contract }, { dispatch, getState }) => {
    const response = await axios.post('/contracts', contract)
    await dispatch(getData(getState().contracts.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updateContract = createAsyncThunk(
  'appContracts/updateContract',
  async ({ id, contract }, { dispatch, getState }) => {
    const response = await axios.put(`/contracts/${id}`, contract)
    await dispatch(getData(getState().contracts.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteContract = createAsyncThunk(
  'appContracts/deleteContract',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/contracts/${id}`)
    await dispatch(getData(getState().contracts.params))
    await dispatch(getAllData())
    return id
  }
)

export const appContractsSlice = createSlice({
  name: 'appContracts',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedContract: null
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
      .addCase(getContract.fulfilled, (state, action) => {
        state.selectedContract = action.payload
      })
  }
})

export default appContractsSlice.reducer
