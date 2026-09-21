import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appContactSubmissions/getAllData', async () => {
  const response = await axios.get('/contacts', { params: { perPage: 100 } })
  return response.data.data.contacts
})

export const getData = createAsyncThunk('appContactSubmissions/getData', async params => {
  const response = await axios.get('/contacts', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      q: params.q || '',
      sortColumn: params.sortColumn || 'created_at',
      sortDirection: params.sort || 'desc'
    }
  })
  return {
    params,
    data: response.data.data.contacts,
    totalPages: response.data.data.total
  }
})

// Marks the submission read server-side (see ContactController::show()),
// clearing its "New" badge in the list once viewed.
export const getContactSubmission = createAsyncThunk('appContactSubmissions/getContactSubmission', async id => {
  const response = await axios.get(`/contacts/${id}`)
  return response.data.data
})

export const deleteContactSubmission = createAsyncThunk(
  'appContactSubmissions/deleteContactSubmission',
  async (id, { dispatch, getState }) => {
    try {
      await axios.delete(`/contacts/${id}`)
      await dispatch(getData(getState().contactSubmissions.params))
      await dispatch(getAllData())
      return id
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to delete')
    }
  }
)

// Manual lead pipeline (New -> Contacted -> Closed) - see
// ContactController::updateStatus(). Re-fetches the list so the Status
// column reflects the change without a full page reload.
export const updateContactSubmissionStatus = createAsyncThunk(
  'appContactSubmissions/updateContactSubmissionStatus',
  async ({ id, status }, { dispatch, getState }) => {
    try {
      const response = await axios.put(`/contacts/${id}/status`, { status })
      await dispatch(getData(getState().contactSubmissions.params))
      await dispatch(getAllData())
      return response.data.data
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to update status')
    }
  }
)

export const getContactSubmissionNotes = createAsyncThunk('appContactSubmissions/getContactSubmissionNotes', async id => {
  const response = await axios.get(`/contacts/${id}/notes`)
  return response.data.data.notes
})

export const addContactSubmissionNote = createAsyncThunk(
  'appContactSubmissions/addContactSubmissionNote',
  async ({ id, note }, { dispatch }) => {
    try {
      await axios.post(`/contacts/${id}/notes`, { note })
      await dispatch(getContactSubmissionNotes(id))
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to add note')
    }
  }
)

export const appContactSubmissionsSlice = createSlice({
  name: 'appContactSubmissions',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedContactSubmission: null,
    notes: []
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
      .addCase(getContactSubmission.fulfilled, (state, action) => {
        state.selectedContactSubmission = action.payload
      })
      .addCase(updateContactSubmissionStatus.fulfilled, (state, action) => {
        state.selectedContactSubmission = action.payload
      })
      .addCase(getContactSubmissionNotes.fulfilled, (state, action) => {
        state.notes = action.payload
      })
  }
})

export default appContactSubmissionsSlice.reducer
