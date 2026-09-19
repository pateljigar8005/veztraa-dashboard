import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appUsers/getAllData', async () => {
  const response = await axios.get('/users', { params: { perPage: 100 } })
  return response.data.data.users
})

export const getData = createAsyncThunk('appUsers/getData', async params => {
  const response = await axios.get('/users', {
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
    data: response.data.data.users,
    totalPages: response.data.data.total
  }
})

export const getUser = createAsyncThunk('appUsers/getUser', async id => {
  const response = await axios.get(`/users/${id}`)
  return response.data.data
})

export const addUser = createAsyncThunk('appUsers/addUser', async (user, { dispatch, getState }) => {
  const response = await axios.post('/users', user)
  await dispatch(getData(getState().users.params))
  await dispatch(getAllData())
  return response.data.data
})

export const updateUser = createAsyncThunk('appUsers/updateUser', async ({ id, ...user }, { dispatch, getState }) => {
  const response = await axios.put(`/users/${id}`, user)
  await dispatch(getData(getState().users.params))
  await dispatch(getAllData())
  return response.data.data
})

export const uploadAvatar = createAsyncThunk('appUsers/uploadAvatar', async ({ id, file }, { dispatch, getState }) => {
  const formData = new FormData()
  formData.append('avatar', file)
  const response = await axios.post(`/users/${id}/avatar`, formData)
  await dispatch(getData(getState().users.params))
  await dispatch(getAllData())
  return response.data.data
})

export const deleteUser = createAsyncThunk('appUsers/deleteUser', async (id, { dispatch, getState }) => {
  await axios.delete(`/users/${id}`)
  await dispatch(getData(getState().users.params))
  await dispatch(getAllData())
  return id
})

export const appUsersSlice = createSlice({
  name: 'appUsers',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedUser: null
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
      .addCase(getUser.fulfilled, (state, action) => {
        state.selectedUser = action.payload
      })
  }
})

export default appUsersSlice.reducer