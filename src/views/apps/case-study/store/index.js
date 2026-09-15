// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appCaseStudies/getAllData', async () => {
  const response = await axios.get('/case-studies', { params: { perPage: 100 } })
  return response.data.data.caseStudies
})

export const getData = createAsyncThunk('appCaseStudies/getData', async params => {
  const response = await axios.get('/case-studies', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      q: params.q || '',
      sortColumn: params.sortColumn || 'sort_order',
      sortDirection: params.sort || 'asc',
      ...params.filters
    }
  })
  return {
    params,
    data: response.data.data.caseStudies,
    totalPages: response.data.data.total
  }
})

export const getCaseStudy = createAsyncThunk('appCaseStudies/getCaseStudy', async id => {
  const response = await axios.get(`/case-studies/${id}`)
  return response.data.data
})

export const addCaseStudy = createAsyncThunk(
  'appCaseStudies/addCaseStudy',
  async (item, { dispatch, getState }) => {
    const response = await axios.post('/case-studies', item)
    await dispatch(getData(getState().caseStudies.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updateCaseStudy = createAsyncThunk(
  'appCaseStudies/updateCaseStudy',
  async ({ id, ...item }, { dispatch, getState }) => {
    const response = await axios.put(`/case-studies/${id}`, item)
    await dispatch(getData(getState().caseStudies.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const uploadCaseStudyCoverImage = createAsyncThunk(
  'appCaseStudies/uploadCaseStudyCoverImage',
  async ({ id, file }, { dispatch, getState }) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await axios.post(`/case-studies/${id}/cover-image`, formData)
    await dispatch(getData(getState().caseStudies.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteCaseStudy = createAsyncThunk(
  'appCaseStudies/deleteCaseStudy',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/case-studies/${id}`)
    await dispatch(getData(getState().caseStudies.params))
    await dispatch(getAllData())
    return id
  }
)

export const appCaseStudiesSlice = createSlice({
  name: 'appCaseStudies',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedCaseStudy: null
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
      .addCase(getCaseStudy.fulfilled, (state, action) => {
        state.selectedCaseStudy = action.payload
      })
  }
})

export default appCaseStudiesSlice.reducer
