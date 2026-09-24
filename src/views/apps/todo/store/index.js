import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getTasks = createAsyncThunk('appTodo/getTasks', async params => {
  const response = await axios.get('/todos', {
    params: {
      filter: params.filter || '',
      q: params.q || '',
      sortBy: params.sortBy || '',
      priority: params.priority || '',
      // Advanced Search's own filters - blank/undefined is fine, the API
      // just ignores whichever of these weren't set (see Todo::all()).
      // adv_status is deliberately a different param name from `filter`
      // above - the sidebar's Status links and Advanced Search's Status
      // field are two independent ways to filter the same column (see
      // Todo::all()'s own note), not one shared control.
      assignee_id: params.assignee_id || '',
      due_date_from: params.due_date_from || '',
      due_date_to: params.due_date_to || '',
      adv_status: params.adv_status || '',
      // '0' (Not Important) is a real choice, not "unset" - params.important
      // is always a string here ('0'/'1'/undefined), and '0' is truthy in
      // JS, so || '' only kicks in when it's genuinely unset.
      important: params.important || ''
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

export const deleteTask = createAsyncThunk('appTodo/deleteTask', async (taskId, { dispatch, getState }) => {  try {

    await axios.delete(`/todos/${taskId}`)
    await dispatch(getTasks(getState().todo.params))
    return taskId

  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }})

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

export const fetchComments = createAsyncThunk('appTodo/fetchComments', async taskId => {
  const response = await axios.get(`/todos/${taskId}/comments`)
  return response.data.data.comments
})

export const addComment = createAsyncThunk('appTodo/addComment', async ({ taskId, comment }, { dispatch }) => {
  await axios.post(`/todos/${taskId}/comments`, { comment })
  await dispatch(fetchComments(taskId))
})

export const deleteComment = createAsyncThunk('appTodo/deleteComment', async ({ id, taskId }, { dispatch }) => {  try {

    await axios.delete(`/todo-comments/${id}`)
    await dispatch(fetchComments(taskId))

  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }})

export const appTodoSlice = createSlice({
  name: 'appTodo',
  initialState: {
    tasks: [],
    selectedTask: {},
    attachments: [],
    comments: [],
    params: {
      filter: '',
      q: '',
      sort: '',
      priority: ''
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
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload
      })
  }
})

export const { reOrderTasks, selectTask } = appTodoSlice.actions

export default appTodoSlice.reducer