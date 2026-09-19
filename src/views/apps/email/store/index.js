import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getFolders = createAsyncThunk('appEmail/getFolders', async () => {
  const response = await axios.get('/mailbox/folders', { signal: new AbortController().signal })
  return response.data.data.folders
})

export const getUnreadCount = createAsyncThunk('appEmail/getUnreadCount', async () => {
  const response = await axios.get('/mailbox/unread-count')
  return response.data.data.unreadCount
})

const inboxUnread = folders => folders?.find(f => f.key === 'INBOX')?.unreadCount

// params.silent: background refresh - updates the list without the spinner.
export const getMessages = createAsyncThunk('appEmail/getMessages', async ({ silent, ...params }) => {
  const response = params.adminMailboxId
    ? await axios.get(`/admin-mailbox/${params.adminMailboxId}/${params.folder}/messages`, {
        params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '' }
      })
    : await axios.get(`/mailbox/${params.folder}/messages`, {
        params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '', ...params.filters }
      })
  return { params, data: response.data.data }
})

export const getFolderView = createAsyncThunk('appEmail/getFolderView', async params => {
  if (params.adminMailboxId) {
    const response = await axios.get(`/admin-mailbox/${params.adminMailboxId}/${params.folder}/messages`, {
      params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '' }
    })
    return {
      params,
      data: {
        folders: [],
        messages: response.data.data.messages,
        total: response.data.data.total,
        lastSyncedAt: response.data.data.lastSyncedAt
      }
    }
  }
  const response = await axios.get(`/mailbox/${params.folder}/view`, {
    params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '', ...params.filters }
  })
  return { params, data: response.data.data }
})

export const getMessage = createAsyncThunk('appEmail/getMessage', async ({ folder, uid, adminMailboxId }, { dispatch }) => {
  if (adminMailboxId) {
    const response = await axios.get(`/admin-mailbox/${adminMailboxId}/${folder}/messages/${uid}`)
    return response.data.data
  }
  const response = await axios.get(`/mailbox/${folder}/messages/${uid}`)
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

const adminBase = (params, folder) => `/admin-mailbox/${params.adminMailboxId}/${folder}/messages`

export const moveMessage = createAsyncThunk(
  'appEmail/moveMessage',
  async ({ folder, uid, to }, { dispatch, getState }) => {
    const params = getState().email.params
    if (params.adminMailboxId) {
      await axios.post(`${adminBase(params, folder)}/${uid}/move`, { to })
      await dispatch(getMessages(params))
      return uid
    }
    await axios.post(`/mailbox/${folder}/messages/${uid}/move`, { to })
    await dispatch(getMessages(params))
    dispatch(getFolders())
    return uid
  }
)

export const deleteMessage = createAsyncThunk(
  'appEmail/deleteMessage',
  async ({ folder, uid }, { dispatch, getState }) => {
    const params = getState().email.params
    if (params.adminMailboxId) {
      await axios.delete(`${adminBase(params, folder)}/${uid}`)
      await dispatch(getMessages(params))
      return uid
    }
    await axios.delete(`/mailbox/${folder}/messages/${uid}`)
    await dispatch(getMessages(params))
    dispatch(getFolders())
    return uid
  }
)

export const bulkDeleteMessages = createAsyncThunk(
  'appEmail/bulkDeleteMessages',
  async ({ folder, uids }, { dispatch, getState }) => {
    const params = getState().email.params
    if (params.adminMailboxId) {
      await axios.post(`${adminBase(params, folder)}/bulk-delete`, { uids })
      await dispatch(getMessages(params))
      return uids
    }
    await axios.post(`/mailbox/${folder}/messages/bulk-delete`, { uids })
    await dispatch(getMessages(params))
    dispatch(getFolders())
    return uids
  }
)

export const sendMessage = createAsyncThunk('appEmail/sendMessage', async (message, { dispatch, getState }) => {
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
  if (message.scheduled_at && params.folder === 'Scheduled') {
    await dispatch(getMessages(params))
  }

  return response.data
})

export const saveDraft = createAsyncThunk('appEmail/saveDraft', async (message, { dispatch, getState }) => {
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

  const response = await axios.post('/mailbox/drafts', payload)
  const params = getState().email.params
  if (params.folder === 'Drafts') {
    await dispatch(getMessages(params))
  }
  return response.data.data
})

export const toggleFlag = createAsyncThunk('appEmail/toggleFlag', async ({ folder, uid, flagged }) => {
  await axios.post(`/mailbox/${folder}/messages/${uid}/flag`, { flagged })
  return { uid, flagged }
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
    messageLoading: false,
    lastSyncedAt: null,
    // Unread INBOX count of the user's OWN mailbox - drives the sidebar badge.
    unreadCount: 0
  },
  reducers: {
    clearCurrentMessage: state => {
      state.currentMessage = null
    },
    removeMessageFromList: (state, action) => {
      const uids = new Set([].concat(action.payload))
      if (state.params.folder === 'INBOX' && !state.params.adminMailboxId) {
        const removedUnread = state.messages.filter(m => uids.has(m.uid) && !m.isRead).length
        state.unreadCount = Math.max(0, state.unreadCount - removedUnread)
      }
      const before = state.messages.length
      state.messages = state.messages.filter(m => !uids.has(m.uid))
      state.total = Math.max(0, state.total - (before - state.messages.length))
    },
    updateMessageFlag: (state, action) => {
      const { uid, flagged } = action.payload
      const inList = state.messages.find(m => m.uid === uid)
      if (inList) inList.isFlagged = flagged
      if (state.currentMessage?.uid === uid) state.currentMessage.isFlagged = flagged
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
        const unread = inboxUnread(action.payload)
        if (unread !== undefined) state.unreadCount = unread
      })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload
      })
      .addCase(getFolders.rejected, state => {
        state.foldersLoading = false
      })
      .addCase(getMessages.pending, (state, action) => {
        if (!action.meta.arg?.silent) state.messagesLoading = true
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.messagesLoading = false
        state.params = action.payload.params
        state.messages = action.payload.data.messages
        state.total = action.payload.data.total
        state.lastSyncedAt = action.payload.data.lastSyncedAt
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
        const unread = inboxUnread(action.payload.data.folders)
        if (unread !== undefined) state.unreadCount = unread
        state.params = action.payload.params
        state.messages = action.payload.data.messages
        state.total = action.payload.data.total
        state.lastSyncedAt = action.payload.data.lastSyncedAt
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
        if (inList && !inList.isRead && state.params.folder === 'INBOX' && !state.params.adminMailboxId) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
        if (inList) inList.isRead = true
      })
      .addCase(getMessage.rejected, state => {
        state.messageLoading = false
      })
  }
})

export const { clearCurrentMessage, removeMessageFromList, updateMessageFlag } = appEmailSlice.actions

export default appEmailSlice.reducer