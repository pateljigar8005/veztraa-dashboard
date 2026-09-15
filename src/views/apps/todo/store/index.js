// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getTasks = createAsyncThunk('appTodo/getTasks', async params => {
  const response = await axios.get('/todos', {
    params: {
      filter: params.filter || '',
      q: params.q || '',
      sortBy: params.sortBy || '',
      tag: params.tag || ''
    }
  })
  return { params, data: response.data.data }
})

export const addTask = createAsyncThunk('appTodo/addTask', async (task, { dispatch, getState }) => {
  const response = await axios.post('/todos', task)
  await dispatch(getTasks(getState().todo.params))
  return response.data.data
})

export const updateTask = createAsyncThunk('appTodo/updateTask', async ({ id, ...task }, { dispatch, getState }) => {
  const response = await axios.put(`/todos/${id}`, task)
  await dispatch(getTasks(getState().todo.params))
  return response.data.data
})

export const deleteTask = createAsyncThunk('appTodo/deleteTask', async (taskId, { dispatch, getState }) => {
  await axios.delete(`/todos/${taskId}`)
  await dispatch(getTasks(getState().todo.params))
  return taskId
})

// Persists a drag-and-drop reorder (see Tasks.js) - the `reOrderTasks`
// reducer below already updates the on-screen order instantly; this just
// saves that same order server-side so it survives a reload.
export const persistTaskOrder = createAsyncThunk('appTodo/persistTaskOrder', async ids => {
  await axios.post('/todos/reorder', { ids })
  return ids
})

export const getTaskAttachments = createAsyncThunk('appTodo/getTaskAttachments', async taskId => {
  const response = await axios.get(`/todos/${taskId}/attachments`)
  return response.data.data.attachments
})

export const uploadTaskAttachment = createAsyncThunk(
  'appTodo/uploadTaskAttachment',
  async ({ taskId, file }) => {
    const formData = new FormData()
    formData.append('attachment', file)
    const response = await axios.post(`/todos/${taskId}/attachments`, formData)
    return response.data.data
  }
)

export const deleteTaskAttachment = createAsyncThunk('appTodo/deleteTaskAttachment', async id => {
  await axios.delete(`/todo-attachments/${id}`)
  return id
})

export const appTodoSlice = createSlice({
  name: 'appTodo',
  initialState: {
    tasks: [],
    selectedTask: {},
    attachments: [],
    params: {
      filter: '',
      q: '',
      sort: '',
      tag: ''
    }
  },
  reducers: {
    reOrderTasks: (state, action) => {
      state.tasks = action.payload
    },
    selectTask: (state, action) => {
      state.selectedTask = action.payload
    }
  },
  extraReducers: builder => {
    builder
      .addCase(getTasks.fulfilled, (state, action) => {
        state.tasks = action.payload.data
        state.params = action.payload.params
      })
      .addCase(getTaskAttachments.fulfilled, (state, action) => {
        state.attachments = action.payload
      })
      .addCase(uploadTaskAttachment.fulfilled, (state, action) => {
        state.attachments = [action.payload, ...state.attachments]
      })
      .addCase(deleteTaskAttachment.fulfilled, (state, action) => {
        state.attachments = state.attachments.filter(a => a.id !== action.payload)
      })
  }
})

export const { reOrderTasks, selectTask } = appTodoSlice.actions

export default appTodoSlice.reducer
