// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appClients/getAllData', async () => {
  const response = await axios.get('/clients', { params: { perPage: 100 } })
  return response.data.data.clients
})

export const getData = createAsyncThunk('appClients/getData', async params => {
  const response = await axios.get('/clients', {
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
    data: response.data.data.clients,
    totalPages: response.data.data.total
  }
})

export const getClient = createAsyncThunk('appClients/getClient', async id => {
  const response = await axios.get(`/clients/${id}`)
  return response.data.data
})

export const addClient = createAsyncThunk('appClients/addClient', async (client, { dispatch, getState }) => {
  const response = await axios.post('/clients', client)
  await dispatch(getData(getState().clients.params))
  await dispatch(getAllData())
  return response.data.data
})

export const updateClient = createAsyncThunk(
  'appClients/updateClient',
  async ({ id, ...client }, { dispatch, getState }) => {
    const response = await axios.put(`/clients/${id}`, client)
    await dispatch(getData(getState().clients.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteClient = createAsyncThunk('appClients/deleteClient', async (id, { dispatch, getState }) => {
  await axios.delete(`/clients/${id}`)
  await dispatch(getData(getState().clients.params))
  await dispatch(getAllData())
  return id
})

export const appClientsSlice = createSlice({
  name: 'appClients',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedClient: null
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
      .addCase(getClient.fulfilled, (state, action) => {
        state.selectedClient = action.payload
      })
  }
})

export default appClientsSlice.reducer
