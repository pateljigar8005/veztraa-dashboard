import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { uploadInChunks } from '../attachmentFiles'

export const getData = createAsyncThunk('appTodo/getData', async params => {
  const response = await axios.get('/todos', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 25,
      sortColumn: params.sortColumn || 'updated_at',
      sortDirection: params.sort || 'desc',
      q: params.q || '',
      ...params.filters
    }
  })
  return { params, data: response.data.data.issues, total: response.data.data.total }
})

export const getIssue = createAsyncThunk('appTodo/getIssue', async id => {
  const response = await axios.get(`/todos/${id}`)
  return response.data.data
})

export const addIssue = createAsyncThunk('appTodo/addIssue', async issue => {
  try {
    const response = await axios.post('/todos', issue)
    return response.data.data
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to report issue')
  }
})

export const updateIssue = createAsyncThunk('appTodo/updateIssue', async ({ id, ...issue }, { dispatch }) => {
  try {
    const response = await axios.put(`/todos/${id}`, issue)
    dispatch(getHistory(id))
    return response.data.data
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to update issue')
  }
})

export const deleteIssue = createAsyncThunk('appTodo/deleteIssue', async (id, { dispatch, getState }) => {
  try {
    await axios.delete(`/todos/${id}`)
    const { params } = getState().todo
    if (params.page) await dispatch(getData(params))
    return id
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }
})

export const getHistory = createAsyncThunk('appTodo/getHistory', async id => {
  const response = await axios.get(`/todos/${id}/history`)
  return response.data.data
})

export const setMonitoring = createAsyncThunk('appTodo/setMonitoring', async ({ id, monitor, userId }, { dispatch }) => {
  try {
    const response = monitor
      ? await axios.post(`/todos/${id}/monitor`, userId ? { user_id: userId } : {})
      : await axios.delete(`/todos/${id}/monitor`, { params: userId ? { user_id: userId } : {} })
    dispatch(getHistory(id))
    return response.data.data
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to update monitoring')
  }
})

export const addRelationship = createAsyncThunk('appTodo/addRelationship', async ({ id, type, otherId }, { dispatch }) => {
  try {
    const response = await axios.post(`/todos/${id}/relationships`, { type, other_id: otherId })
    dispatch(getHistory(id))
    return response.data.data
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to add relationship')
  }
})

export const deleteRelationship = createAsyncThunk('appTodo/deleteRelationship', async ({ id, issueId }, { dispatch }) => {
  try {
    await axios.delete(`/todo-relationships/${id}`)
    await dispatch(getIssue(issueId))
    dispatch(getHistory(issueId))
    return id
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to remove relationship')
  }
})

export const getTaskAttachments = createAsyncThunk('appTodo/getTaskAttachments', async taskId => {
  const response = await axios.get(`/todos/${taskId}/attachments`)
  return response.data.data.attachments
})

export const uploadTaskAttachment = createAsyncThunk('appTodo/uploadTaskAttachment', async ({ taskId, file }, { dispatch }) => {
  try {
    const attachment = await uploadInChunks(taskId, file)
    dispatch(getHistory(taskId))
    return attachment
  } catch (err) {
    throw new Error(err?.response?.data?.message || `Failed to upload "${file.name}"`)
  }
})

export const deleteTaskAttachment = createAsyncThunk('appTodo/deleteTaskAttachment', async ({ id, taskId }, { dispatch }) => {
  await axios.delete(`/todo-attachments/${id}`)
  dispatch(getHistory(taskId))
  return id
})

export const fetchComments = createAsyncThunk('appTodo/fetchComments', async taskId => {
  const response = await axios.get(`/todos/${taskId}/comments`)
  return response.data.data.comments
})

export const addComment = createAsyncThunk('appTodo/addComment', async ({ taskId, comment, mentionedUserIds = [] }, { dispatch }) => {
  await axios.post(`/todos/${taskId}/comments`, { comment, mentioned_user_ids: mentionedUserIds })
  await dispatch(fetchComments(taskId))
  dispatch(getHistory(taskId))
})

export const editComment = createAsyncThunk('appTodo/editComment', async ({ id, taskId, comment, mentionedUserIds = [] }, { dispatch }) => {
  try {
    await axios.put(`/todo-comments/${id}`, { comment, mentioned_user_ids: mentionedUserIds })
    await dispatch(fetchComments(taskId))
    dispatch(getHistory(taskId))
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to update note')
  }
})

export const deleteComment = createAsyncThunk('appTodo/deleteComment', async ({ id, taskId }, { dispatch }) => {
  try {
    await axios.delete(`/todo-comments/${id}`)
    await dispatch(fetchComments(taskId))
    dispatch(getHistory(taskId))
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }
})

export const appTodoSlice = createSlice({
  name: 'appTodo',
  initialState: {
    data: [],
    total: 0,
    params: {},
    selectedIssue: null,
    history: [],
    attachments: [],
    comments: []
  },
  reducers: {},
  extraReducers: builder => {
    const setIssue = (state, action) => {
      if (action.payload) state.selectedIssue = action.payload
    }
    builder
      .addCase(getData.fulfilled, (state, action) => {
        state.data = action.payload.data
        state.total = action.payload.total
        state.params = action.payload.params
      })
      .addCase(getIssue.pending, (state, action) => {
        // Don't flash the previous issue's details while another one loads.
        if (state.selectedIssue?.id !== Number(action.meta.arg)) {
          state.selectedIssue = null
          state.history = []
          state.comments = []
          state.attachments = []
        }
      })
      .addCase(getIssue.fulfilled, setIssue)
      .addCase(updateIssue.fulfilled, setIssue)
      .addCase(setMonitoring.fulfilled, setIssue)
      .addCase(addRelationship.fulfilled, setIssue)
      .addCase(getHistory.fulfilled, (state, action) => {
        state.history = action.payload
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

export default appTodoSlice.reducer
