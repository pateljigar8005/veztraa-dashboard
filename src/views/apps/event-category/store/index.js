import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appEventCategories/getAllData', async () => {
  const response = await axios.get('/event-categories', { params: { perPage: 100 } })
  return response.data.data.eventCategories
})

export const getData = createAsyncThunk('appEventCategories/getData', async params => {
  const response = await axios.get('/event-categories', {
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
    data: response.data.data.eventCategories,
    totalPages: response.data.data.total
  }
})

export const getEventCategory = createAsyncThunk('appEventCategories/getEventCategory', async id => {
  const response = await axios.get(`/event-categories/${id}`)
  return response.data.data
})

export const addEventCategory = createAsyncThunk(
  'appEventCategories/addEventCategory',
  async (eventCategory, { dispatch, getState }) => {
    const response = await axios.post('/event-categories', eventCategory)
    await dispatch(getData(getState().eventCategories.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updateEventCategory = createAsyncThunk(
  'appEventCategories/updateEventCategory',
  async ({ id, ...eventCategory }, { dispatch, getState }) => {
    const response = await axios.put(`/event-categories/${id}`, eventCategory)
    await dispatch(getData(getState().eventCategories.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteEventCategory = createAsyncThunk(
  'appEventCategories/deleteEventCategory',
  async (id, { dispatch, getState }) => {    try {

      await axios.delete(`/event-categories/${id}`)
      await dispatch(getData(getState().eventCategories.params))
      await dispatch(getAllData())
      return id
  
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to delete')
    }}
)

export const appEventCategoriesSlice = createSlice({
  name: 'appEventCategories',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedEventCategory: null
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
      .addCase(getEventCategory.fulfilled, (state, action) => {
        state.selectedEventCategory = action.payload
      })
  }
})

export default appEventCategoriesSlice.reducer
