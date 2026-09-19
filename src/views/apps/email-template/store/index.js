import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appEmailTemplates/getAllData', async () => {
  const response = await axios.get('/email-templates', { params: { perPage: 100 } })
  return response.data.data.emailTemplates
})

export const getData = createAsyncThunk('appEmailTemplates/getData', async params => {
  const response = await axios.get('/email-templates', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      q: params.q || '',
      sortColumn: params.sortColumn || 'id',
      sortDirection: params.sort || 'desc'
    }
  })
  return {
    params,
    data: response.data.data.emailTemplates,
    totalPages: response.data.data.total
  }
})

export const getEmailTemplate = createAsyncThunk('appEmailTemplates/getEmailTemplate', async id => {
  const response = await axios.get(`/email-templates/${id}`)
  return response.data.data
})

export const addEmailTemplate = createAsyncThunk(
  'appEmailTemplates/addEmailTemplate',
  async (template, { dispatch, getState }) => {
    const response = await axios.post('/email-templates', template)
    await dispatch(getData(getState().emailTemplates.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updateEmailTemplate = createAsyncThunk(
  'appEmailTemplates/updateEmailTemplate',
  async ({ id, ...template }, { dispatch, getState }) => {
    const response = await axios.put(`/email-templates/${id}`, template)
    await dispatch(getData(getState().emailTemplates.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteEmailTemplate = createAsyncThunk(
  'appEmailTemplates/deleteEmailTemplate',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/email-templates/${id}`)
    await dispatch(getData(getState().emailTemplates.params))
    await dispatch(getAllData())
    return id
  }
)

export const appEmailTemplatesSlice = createSlice({
  name: 'appEmailTemplates',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedEmailTemplate: null
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
      .addCase(getEmailTemplate.fulfilled, (state, action) => {
        state.selectedEmailTemplate = action.payload
      })
  }
})

export default appEmailTemplatesSlice.reducer