import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appPdfDesignerTemplates/getAllData', async () => {
  const response = await axios.get('/pdf-designer-templates', { params: { perPage: 100 } })
  return response.data.data.pdfDesignerTemplates
})

export const getData = createAsyncThunk('appPdfDesignerTemplates/getData', async params => {
  const response = await axios.get('/pdf-designer-templates', {
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
    data: response.data.data.pdfDesignerTemplates,
    totalPages: response.data.data.total
  }
})

export const getPdfDesignerTemplate = createAsyncThunk('appPdfDesignerTemplates/getPdfDesignerTemplate', async id => {
  const response = await axios.get(`/pdf-designer-templates/${id}`)
  return response.data.data
})

export const addPdfDesignerTemplate = createAsyncThunk(
  'appPdfDesignerTemplates/addPdfDesignerTemplate',
  async (template, { dispatch, getState }) => {
    const response = await axios.post('/pdf-designer-templates', template)
    await dispatch(getData(getState().pdfDesignerTemplates.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updatePdfDesignerTemplate = createAsyncThunk(
  'appPdfDesignerTemplates/updatePdfDesignerTemplate',
  async ({ id, ...template }, { dispatch, getState }) => {
    const response = await axios.put(`/pdf-designer-templates/${id}`, template)
    await dispatch(getData(getState().pdfDesignerTemplates.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deletePdfDesignerTemplate = createAsyncThunk(
  'appPdfDesignerTemplates/deletePdfDesignerTemplate',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/pdf-designer-templates/${id}`)
    await dispatch(getData(getState().pdfDesignerTemplates.params))
    await dispatch(getAllData())
    return id
  }
)

export const appPdfDesignerTemplatesSlice = createSlice({
  name: 'appPdfDesignerTemplates',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedPdfDesignerTemplate: null
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
      .addCase(getPdfDesignerTemplate.fulfilled, (state, action) => {
        state.selectedPdfDesignerTemplate = action.payload
      })
  }
})

export default appPdfDesignerTemplatesSlice.reducer