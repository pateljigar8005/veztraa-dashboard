import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { resizeToJpeg, uploadToR2 } from '@src/utility/imageUpload'

export const getAllData = createAsyncThunk('appPortfolioItems/getAllData', async () => {
  const response = await axios.get('/portfolio-items', { params: { perPage: 100 } })
  return response.data.data.portfolioItems
})

export const getData = createAsyncThunk('appPortfolioItems/getData', async params => {
  const response = await axios.get('/portfolio-items', {
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
    data: response.data.data.portfolioItems,
    totalPages: response.data.data.total
  }
})

export const getPortfolioItem = createAsyncThunk('appPortfolioItems/getPortfolioItem', async id => {
  const response = await axios.get(`/portfolio-items/${id}`)
  return response.data.data
})

export const addPortfolioItem = createAsyncThunk(
  'appPortfolioItems/addPortfolioItem',
  async (item, { dispatch, getState }) => {
    const response = await axios.post('/portfolio-items', item)
    await dispatch(getData(getState().portfolioItems.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const updatePortfolioItem = createAsyncThunk(
  'appPortfolioItems/updatePortfolioItem',
  async ({ id, ...item }, { dispatch, getState }) => {
    const response = await axios.put(`/portfolio-items/${id}`, item)
    await dispatch(getData(getState().portfolioItems.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const uploadPortfolioItemImage = createAsyncThunk(
  'appPortfolioItems/uploadPortfolioItemImage',
  async ({ id, file }, { dispatch, getState }) => {
    const url = await uploadToR2('portfolio-image', await resizeToJpeg(file))
    const response = await axios.post(`/portfolio-items/${id}/image`, { url })
    await dispatch(getData(getState().portfolioItems.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deletePortfolioItem = createAsyncThunk(
  'appPortfolioItems/deletePortfolioItem',
  async (id, { dispatch, getState }) => {
    await axios.delete(`/portfolio-items/${id}`)
    await dispatch(getData(getState().portfolioItems.params))
    await dispatch(getAllData())
    return id
  }
)

export const appPortfolioItemsSlice = createSlice({
  name: 'appPortfolioItems',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedPortfolioItem: null
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
      .addCase(getPortfolioItem.fulfilled, (state, action) => {
        state.selectedPortfolioItem = action.payload
      })
  }
})

export default appPortfolioItemsSlice.reducer