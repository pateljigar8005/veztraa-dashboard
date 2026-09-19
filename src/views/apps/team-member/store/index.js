import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appTeamMembers/getAllData', async () => {
  const response = await axios.get('/team-members', { params: { perPage: 100 } })
  return response.data.data.teamMembers
})

export const getData = createAsyncThunk('appTeamMembers/getData', async params => {
  const response = await axios.get('/team-members', {
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
    data: response.data.data.teamMembers,
    totalPages: response.data.data.total
  }
})

export const getTeamMember = createAsyncThunk('appTeamMembers/getTeamMember', async id => {
  const response = await axios.get(`/team-members/${id}`)
  return response.data.data
})

export const addTeamMember = createAsyncThunk('appTeamMembers/addTeamMember', async (member, { dispatch, getState }) => {
  const response = await axios.post('/team-members', member)
  await dispatch(getData(getState().teamMembers.params))
  await dispatch(getAllData())
  return response.data.data
})

export const updateTeamMember = createAsyncThunk(
  'appTeamMembers/updateTeamMember',
  async ({ id, ...member }, { dispatch, getState }) => {
    const response = await axios.put(`/team-members/${id}`, member)
    await dispatch(getData(getState().teamMembers.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const uploadTeamMemberPhoto = createAsyncThunk(
  'appTeamMembers/uploadTeamMemberPhoto',
  async ({ id, file }, { dispatch, getState }) => {
    const formData = new FormData()
    formData.append('photo', file)
    const response = await axios.post(`/team-members/${id}/photo`, formData)
    await dispatch(getData(getState().teamMembers.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteTeamMember = createAsyncThunk('appTeamMembers/deleteTeamMember', async (id, { dispatch, getState }) => {
  await axios.delete(`/team-members/${id}`)
  await dispatch(getData(getState().teamMembers.params))
  await dispatch(getAllData())
  return id
})

export const appTeamMembersSlice = createSlice({
  name: 'appTeamMembers',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedTeamMember: null
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
      .addCase(getTeamMember.fulfilled, (state, action) => {
        state.selectedTeamMember = action.payload
      })
  }
})

export default appTeamMembersSlice.reducer