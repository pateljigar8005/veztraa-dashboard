// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getAllData = createAsyncThunk('appHolidays/getAllData', async () => {
  const response = await axios.get('/holidays', { params: { perPage: 100 } })
  return response.data.data.holidays
})

export const getData = createAsyncThunk('appHolidays/getData', async params => {
  const response = await axios.get('/holidays', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      q: params.q || '',
      sortColumn: params.sortColumn || 'date',
      sortDirection: params.sort || 'asc'
    }
  })
  return {
    params,
    data: response.data.data.holidays,
    totalPages: response.data.data.total
  }
})

export const getHoliday = createAsyncThunk('appHolidays/getHoliday', async id => {
  const response = await axios.get(`/holidays/${id}`)
  return response.data.data
})

// ** rejectWithValue on both add/update (unlike every other module's own add/
// update thunks) so the form's own .unwrap().catch() can read the real 422
// body - specifically errors.date, the one validation failure this form
// needs to point at a field (a duplicate holiday date) rather than just a
// generic toast. Without this, RTK's default rejection only carries a
// generic serialized JS Error (just a message like "Request failed with
// status code 422"), not the actual response body.
export const addHoliday = createAsyncThunk(
  'appHolidays/addHoliday',
  async (holiday, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await axios.post('/holidays', holiday)
      await dispatch(getData(getState().holidays.params))
      await dispatch(getAllData())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const updateHoliday = createAsyncThunk(
  'appHolidays/updateHoliday',
  async ({ id, ...holiday }, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await axios.put(`/holidays/${id}`, holiday)
      await dispatch(getData(getState().holidays.params))
      await dispatch(getAllData())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const deleteHoliday = createAsyncThunk('appHolidays/deleteHoliday', async (id, { dispatch, getState }) => {
  await axios.delete(`/holidays/${id}`)
  await dispatch(getData(getState().holidays.params))
  await dispatch(getAllData())
  return id
})

export const appHolidaysSlice = createSlice({
  name: 'appHolidays',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedHoliday: null
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
      .addCase(getHoliday.fulfilled, (state, action) => {
        state.selectedHoliday = action.payload
      })
  }
})

export default appHolidaysSlice.reducer
