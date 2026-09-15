// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appTermsTemplates/getAllData', async () => {
  const response = await axios.get('/terms-templates', { params: { perPage: 100 } })
  return response.data.data.termsTemplates
})

export const getData = createAsyncThunk('appTermsTemplates/getData', async params => {
  const response = await axios.get('/terms-templates', {
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
    data: response.data.data.termsTemplates,
    totalPages: response.data.data.total
  }
})

export const getTermsTemplate = createAsyncThunk('appTermsTemplates/getTermsTemplate', async id => {
  const response = await axios.get(`/terms-templates/${id}`)
  return response.data.data
})

export const addTermsTemplate = createAsyncThunk(
  'appTermsTemplates/addTermsTemplate',
  async (template, { dispatch, getState }) => {
    const response = await axios.post('/terms-templates', template)
    await dispatch(getData(getState().termsTemplates.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updateTermsTemplate = createAsyncThunk(
  'appTermsTemplates/updateTermsTemplate',
  async ({ id, ...template }, { dispatch, getState }) => {
    const response = await axios.put(`/terms-templates/${id}`, template)
    await dispatch(getData(getState().termsTemplates.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteTermsTemplate = createAsyncThunk(
  'appTermsTemplates/deleteTermsTemplate',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/terms-templates/${id}`)
    await dispatch(getData(getState().termsTemplates.params))
    await dispatch(getAllData())
    return id
  }
)

export const appTermsTemplatesSlice = createSlice({
  name: 'appTermsTemplates',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedTermsTemplate: null
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
      .addCase(getTermsTemplate.fulfilled, (state, action) => {
        state.selectedTermsTemplate = action.payload
      })
  }
})

export default appTermsTemplatesSlice.reducer
