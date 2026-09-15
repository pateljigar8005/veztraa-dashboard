// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appServiceItems/getAllData', async () => {
  const response = await axios.get('/service-items', { params: { perPage: 100 } })
  return response.data.data.serviceItems
})

export const getData = createAsyncThunk('appServiceItems/getData', async params => {
  const response = await axios.get('/service-items', {
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
    data: response.data.data.serviceItems,
    totalPages: response.data.data.total
  }
})

export const getServiceItem = createAsyncThunk('appServiceItems/getServiceItem', async id => {
  const response = await axios.get(`/service-items/${id}`)
  return response.data.data
})

export const addServiceItem = createAsyncThunk(
  'appServiceItems/addServiceItem',
  async (serviceItem, { dispatch, getState }) => {
    const response = await axios.post('/service-items', serviceItem)
    await dispatch(getData(getState().serviceItems.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updateServiceItem = createAsyncThunk(
  'appServiceItems/updateServiceItem',
  async ({ id, ...serviceItem }, { dispatch, getState }) => {
    const response = await axios.put(`/service-items/${id}`, serviceItem)
    await dispatch(getData(getState().serviceItems.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteServiceItem = createAsyncThunk(
  'appServiceItems/deleteServiceItem',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/service-items/${id}`)
    await dispatch(getData(getState().serviceItems.params))
    await dispatch(getAllData())
    return id
  }
)

export const appServiceItemsSlice = createSlice({
  name: 'appServiceItems',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedServiceItem: null
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
      .addCase(getServiceItem.fulfilled, (state, action) => {
        state.selectedServiceItem = action.payload
      })
  }
})

export default appServiceItemsSlice.reducer
