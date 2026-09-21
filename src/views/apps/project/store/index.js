import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appProjects/getAllData', async () => {
  const response = await axios.get('/projects', { params: { perPage: 100 } })
  return response.data.data.projects
})

export const getData = createAsyncThunk('appProjects/getData', async params => {
  const response = await axios.get('/projects', {
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
    data: response.data.data.projects,
    totalPages: response.data.data.total
  }
})

export const getProject = createAsyncThunk('appProjects/getProject', async id => {
  const response = await axios.get(`/projects/${id}`)
  return response.data.data
})

export const addProject = createAsyncThunk('appProjects/addProject', async (project, { dispatch, getState }) => {
  const response = await axios.post('/projects', project)
  await dispatch(getData(getState().projects.params))
  await dispatch(getAllData())
  return response.data.data
})

export const updateProject = createAsyncThunk(
  'appProjects/updateProject',
  async ({ id, ...project }, { dispatch, getState }) => {
    const response = await axios.put(`/projects/${id}`, project)
    await dispatch(getData(getState().projects.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteProject = createAsyncThunk('appProjects/deleteProject', async (id, { dispatch, getState }) => {  try {

    await axios.delete(`/projects/${id}`)
    await dispatch(getData(getState().projects.params))
    await dispatch(getAllData())
    return id

  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }})

export const getProjectDocuments = createAsyncThunk('appProjects/getProjectDocuments', async projectId => {
  const response = await axios.get(`/projects/${projectId}/documents`)
  return response.data.data.documents
})

export const uploadProjectDocument = createAsyncThunk(
  'appProjects/uploadProjectDocument',
  async ({ projectId, file }) => {
    const formData = new FormData()
    formData.append('document', file)
    const response = await axios.post(`/projects/${projectId}/documents`, formData)
    return response.data.data
  }
)

export const deleteProjectDocument = createAsyncThunk('appProjects/deleteProjectDocument', async id => {
  await axios.delete(`/project-documents/${id}`)
  return id
})

export const appProjectsSlice = createSlice({
  name: 'appProjects',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedProject: null,
    documents: []
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
      .addCase(getProject.fulfilled, (state, action) => {
        state.selectedProject = action.payload
      })
      .addCase(getProjectDocuments.fulfilled, (state, action) => {
        state.documents = action.payload
      })
      .addCase(uploadProjectDocument.fulfilled, (state, action) => {
        state.documents = [action.payload, ...state.documents]
      })
      .addCase(deleteProjectDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(d => d.id !== action.payload)
      })
  }
})

export default appProjectsSlice.reducer