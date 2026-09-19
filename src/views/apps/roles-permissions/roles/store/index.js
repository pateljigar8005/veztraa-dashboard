import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appRoles/getAllData', async () => {
  const response = await axios.get('/roles')
  return response.data.data
})

export const getRole = createAsyncThunk('appRoles/getRole', async id => {
  const response = await axios.get(`/roles/${id}`)
  return response.data.data
})

export const addRole = createAsyncThunk('appRoles/addRole', async (role, { dispatch, rejectWithValue }) => {
  try {
    const response = await axios.post('/roles', role)
    await dispatch(getAllData())
    return response.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const updateRole = createAsyncThunk(
  'appRoles/updateRole',
  async ({ id, ...role }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.put(`/roles/${id}`, role)
      await dispatch(getAllData())
      return response.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

export const deleteRole = createAsyncThunk('appRoles/deleteRole', async (id, { dispatch, rejectWithValue }) => {
  try {
    await axios.delete(`/roles/${id}`)
    await dispatch(getAllData())
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const appRolesSlice = createSlice({
  name: 'appRoles',
  initialState: {
    allData: [],
    selectedRole: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getAllData.fulfilled, (state, action) => {
        state.allData = action.payload
      })
      .addCase(getRole.fulfilled, (state, action) => {
        state.selectedRole = action.payload
      })
  }
})

export default appRolesSlice.reducer