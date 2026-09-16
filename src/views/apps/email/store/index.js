// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const getFolders = createAsyncThunk('appEmail/getFolders', async () => {
  const response = await axios.get('/mailbox/folders')
  return response.data.data.folders
})

export const getMessages = createAsyncThunk('appEmail/getMessages', async params => {
  const response = await axios.get(`/mailbox/${params.folder}/messages`, {
    params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '' }
  })
  return { params, data: response.data.data }
})

// ** Combined folders + message-list fetch (one IMAP login instead of two) -
// used for the common "open/switch to a folder" flow. Each request to our
// mail server pays a real, sometimes multi-second login cost (see the
// backend's MailboxController::view() for the measured breakdown), so
// halving how many separate logins a single page view needs is a real win.
export const getFolderView = createAsyncThunk('appEmail/getFolderView', async params => {
  const response = await axios.get(`/mailbox/${params.folder}/view`, {
    params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '' }
  })
  return { params, data: response.data.data }
})

export const getMessage = createAsyncThunk('appEmail/getMessage', async ({ folder, uid }, { dispatch }) => {
  const response = await axios.get(`/mailbox/${folder}/messages/${uid}`)
  // Opening a message can flip its unread status server-side - refresh the
  // folder badge counts so the sidebar stays in sync.
  dispatch(getFolders())
  return response.data.data
})

export const setMessageRead = createAsyncThunk(
  'appEmail/setMessageRead',
  async ({ folder, uid, read }, { dispatch, getState }) => {
    await axios.post(`/mailbox/${folder}/messages/${uid}/read`, { read })
    await dispatch(getMessages(getState().email.params))
    dispatch(getFolders())
    return { uid, read }
  }
)

export const moveMessage = createAsyncThunk(
  'appEmail/moveMessage',
  async ({ folder, uid, to }, { dispatch, getState }) => {
    await axios.post(`/mailbox/${folder}/messages/${uid}/move`, { to })
    await dispatch(getMessages(getState().email.params))
    dispatch(getFolders())
    return uid
  }
)

export const deleteMessage = createAsyncThunk(
  'appEmail/deleteMessage',
  async ({ folder, uid }, { dispatch, getState }) => {
    await axios.delete(`/mailbox/${folder}/messages/${uid}`)
    await dispatch(getMessages(getState().email.params))
    dispatch(getFolders())
    return uid
  }
)

export const sendMessage = createAsyncThunk('appEmail/sendMessage', async (message, { dispatch, getState }) => {
  // Plain JSON when there's nothing to attach; multipart/form-data (which
  // the backend's Request class auto-detects via Content-Type) only when
  // there are real files to carry - see MailboxController::send().
  let payload = message
  if (message.attachments?.length) {
    const formData = new FormData()
    Object.entries(message).forEach(([key, value]) => {
      if (key === 'attachments' || value === null || value === undefined) return
      formData.append(key, value)
    })
    message.attachments.forEach(file => formData.append('attachments[]', file))
    payload = formData
  }

  const response = await axios.post('/mailbox/send', payload)
  const params = getState().email.params
  if (params.folder === 'Sent') {
    await dispatch(getMessages(params))
  }
  return response.data
})

export const appEmailSlice = createSlice({
  name: 'appEmail',
  initialState: {
    folders: [],
    foldersLoading: false,
    messages: [],
    messagesLoading: false,
    total: 0,
    params: { folder: 'INBOX' },
    currentMessage: null,
    messageLoading: false
  },
  reducers: {
    clearCurrentMessage: state => {
      state.currentMessage = null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(getFolders.pending, state => {
        state.foldersLoading = true
      })
      .addCase(getFolders.fulfilled, (state, action) => {
        state.foldersLoading = false
        state.folders = action.payload
      })
      .addCase(getFolders.rejected, state => {
        state.foldersLoading = false
      })
      .addCase(getMessages.pending, state => {
        state.messagesLoading = true
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.messagesLoading = false
        state.params = action.payload.params
        state.messages = action.payload.data.messages
        state.total = action.payload.data.total
      })
      .addCase(getMessages.rejected, state => {
        state.messagesLoading = false
      })
      .addCase(getFolderView.pending, state => {
        state.foldersLoading = true
        state.messagesLoading = true
      })
      .addCase(getFolderView.fulfilled, (state, action) => {
        state.foldersLoading = false
        state.messagesLoading = false
        state.folders = action.payload.data.folders
        state.params = action.payload.params
        state.messages = action.payload.data.messages
        state.total = action.payload.data.total
      })
      .addCase(getFolderView.rejected, state => {
        state.foldersLoading = false
        state.messagesLoading = false
      })
      .addCase(getMessage.pending, state => {
        state.messageLoading = true
      })
      .addCase(getMessage.fulfilled, (state, action) => {
        state.messageLoading = false
        state.currentMessage = action.payload
        const inList = state.messages.find(m => m.uid === action.payload.uid)
        if (inList) inList.isRead = true
      })
      .addCase(getMessage.rejected, state => {
        state.messageLoading = false
      })
  }
})

export const { clearCurrentMessage } = appEmailSlice.actions

export default appEmailSlice.reducer
