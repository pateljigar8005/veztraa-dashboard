import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchBoards = createAsyncThunk('appKanban/fetchBoards', async () => {
  const response = await axios.get('/kanban-boards')
  return response.data.data.boards
})

export const fetchTasks = createAsyncThunk('appKanban/fetchTasks', async () => {
  const response = await axios.get('/kanban-tasks')
  return response.data.data.tasks
})

export const addBoard = createAsyncThunk('appKanban/addBoard', async (data, { dispatch }) => {
  const response = await axios.post('/kanban-boards', data)
  await dispatch(fetchBoards())
  return response.data.data
})

export const updateBoardTitle = createAsyncThunk('appKanban/updateBoardTitle', async ({ id, title }, { dispatch }) => {
  const response = await axios.put(`/kanban-boards/${id}`, { title })
  await dispatch(fetchBoards())
  return response.data.data
})

export const deleteBoard = createAsyncThunk('appKanban/deleteBoard', async (id, { dispatch }) => {  try {

    await axios.delete(`/kanban-boards/${id}`)
    await dispatch(fetchBoards())
    await dispatch(fetchTasks())
    return id

  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }})

export const clearTasks = createAsyncThunk('appKanban/clearTasks', async (boardId, { dispatch }) => {
  await axios.delete(`/kanban-boards/${boardId}/tasks`)
  await dispatch(fetchTasks())
  return boardId
})

export const addTask = createAsyncThunk('appKanban/addTask', async (data, { dispatch }) => {
  const response = await axios.post('/kanban-tasks', data)
  await dispatch(fetchTasks())
  return response.data.data
})

export const updateTask = createAsyncThunk('appKanban/updateTask', async ({ id, ...data }, { dispatch }) => {
  const response = await axios.put(`/kanban-tasks/${id}`, data)
  await dispatch(fetchTasks())
  return response.data.data
})

export const deleteTask = createAsyncThunk('appKanban/deleteTask', async (id, { dispatch }) => {  try {

    await axios.delete(`/kanban-tasks/${id}`)
    await dispatch(fetchTasks())
    return id

  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }})

export const moveTaskToBoard = createAsyncThunk(
  'appKanban/moveTaskToBoard',
  async ({ taskId, newBoardId }, { dispatch }) => {
    const response = await axios.put(`/kanban-tasks/${taskId}`, { board_id: newBoardId })
    await dispatch(fetchTasks())
    return response.data.data
  }
)

export const reorderTasks = createAsyncThunk('appKanban/reorderTasks', async ({ taskId, targetTaskId }, { dispatch }) => {
  const response = await axios.put('/kanban-tasks/reorder', { taskId, targetTaskId })
  await dispatch(fetchTasks())
  return response.data.data
})

export const fetchComments = createAsyncThunk('appKanban/fetchComments', async taskId => {
  const response = await axios.get(`/kanban-tasks/${taskId}/comments`)
  return response.data.data.comments
})

export const addComment = createAsyncThunk('appKanban/addComment', async ({ taskId, comment }, { dispatch }) => {
  await axios.post(`/kanban-tasks/${taskId}/comments`, { comment })
  await dispatch(fetchComments(taskId))
  await dispatch(fetchTasks())
})

export const deleteComment = createAsyncThunk('appKanban/deleteComment', async ({ id, taskId }, { dispatch }) => {  try {

    await axios.delete(`/kanban-task-comments/${id}`)
    await dispatch(fetchComments(taskId))
    await dispatch(fetchTasks())

  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }})

export const getTaskAttachments = createAsyncThunk('appKanban/getTaskAttachments', async taskId => {
  const response = await axios.get(`/kanban-tasks/${taskId}/attachments`)
  return response.data.data.attachments
})

export const uploadTaskAttachment = createAsyncThunk(
  'appKanban/uploadTaskAttachment',
  async ({ taskId, file }) => {
    const formData = new FormData()
    formData.append('attachment', file)
    const response = await axios.post(`/kanban-tasks/${taskId}/attachments`, formData)
    return response.data.data
  }
)

export const deleteTaskAttachment = createAsyncThunk('appKanban/deleteTaskAttachment', async id => {
  await axios.delete(`/kanban-task-attachments/${id}`)
  return id
})

export const appKanbanSlice = createSlice({
  name: 'appKanban',
  initialState: {
    tasks: [],
    boards: [],
    selectedTask: null,
    comments: [],
    attachments: []
  },
  reducers: {
    handleSelectTask: (state, action) => {
      state.selectedTask = action.payload
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.boards = action.payload
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasks = action.payload
        if (state.selectedTask) {
          state.selectedTask = action.payload.find(t => t.id === state.selectedTask.id) || state.selectedTask
        }
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload
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

export const { handleSelectTask } = appKanbanSlice.actions

export default appKanbanSlice.reducer