import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getFolders = createAsyncThunk('appEmail/getFolders', async () => {
  const response = await axios.get('/mailbox/folders', { signal: new AbortController().signal })
  return response.data.data.folders
})

// The admin's "Browse Mailbox" choice is remembered across reloads (see the
// Email page) and read here too, so the menu badge can follow it on any page.
const MAILBOX_STORAGE_KEY = 'email.viewingMailboxId'

export const readStoredMailboxId = () => {
  try {
    const isAdmin = (JSON.parse(localStorage.getItem('userData'))?.role || '').toLowerCase() === 'admin'
    const value = Number(localStorage.getItem(MAILBOX_STORAGE_KEY))
    return isAdmin && value > 0 ? value : null
  } catch (e) {
    return null
  }
}

export const storeMailboxId = id => {
  try {
    if (id) localStorage.setItem(MAILBOX_STORAGE_KEY, String(id))
    else localStorage.removeItem(MAILBOX_STORAGE_KEY)
  } catch (e) {
    // storage unavailable - selection just won't survive a reload
  }
}

// Unread INBOX count of the mailbox currently selected (own or an admin one).
export const getUnreadCount = createAsyncThunk('appEmail/getUnreadCount', async () => {
  const mailboxId = readStoredMailboxId()
  const response = await axios.get(mailboxId ? `/admin-mailbox/${mailboxId}/unread-count` : '/mailbox/unread-count')
  return response.data.data.unreadCount
})

// Adjusts the INBOX unread count shown in the Email sidebar and the menu
// badge (both follow the selected mailbox) without a server round trip.
const adjustInboxUnread = (state, delta) => {
  if (state.params.folder !== 'INBOX' || !delta) return
  const inbox = state.folders.find(f => f.key === 'INBOX')
  if (inbox) inbox.unreadCount = Math.max(0, (inbox.unreadCount || 0) + delta)
  state.unreadCount = Math.max(0, state.unreadCount + delta)
}

const inboxUnread = folders => folders?.find(f => f.key === 'INBOX')?.unreadCount

// params.silent: background refresh - updates the list without the spinner.
export const getMessages = createAsyncThunk('appEmail/getMessages', async ({ silent, ...params }) => {
  const response = params.adminMailboxId
    ? await axios.get(`/admin-mailbox/${params.adminMailboxId}/${params.folder}/messages`, {
        params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '', ...params.filters }
      })
    : await axios.get(`/mailbox/${params.folder}/messages`, {
        params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '', ...params.filters }
      })
  return { params, data: response.data.data }
})

export const getFolderView = createAsyncThunk('appEmail/getFolderView', async params => {
  if (params.adminMailboxId) {
    const response = await axios.get(`/admin-mailbox/${params.adminMailboxId}/${params.folder}/messages`, {
      params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '', ...params.filters }
    })
    return {
      params,
      data: {
        folders: response.data.data.folders || [],
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
  async ({ folder, uid }, { dispatch, getState }) => {    try {

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
  
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to delete')
    }}
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

  // The message is already listed (Scheduled, or Sent under a temporary row
  // until the background send finishes) - refresh if that's the open folder.
  const params = getState().email.params
  if (params.folder === (message.scheduled_at ? 'Scheduled' : 'Sent')) {
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
    // Unread INBOX count of the selected mailbox - drives the menu badge.
    unreadCount: 0
  },
  reducers: {
    clearCurrentMessage: state => {
      state.currentMessage = null
    },
    removeMessageFromList: (state, action) => {
      const uids = new Set([].concat(action.payload))
      adjustInboxUnread(state, -state.messages.filter(m => uids.has(m.uid) && !m.isRead).length)
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
        // Only an admin mailbox's list response carries folder counts.
        if (action.payload.data.folders) {
          state.folders = action.payload.data.folders
          const unread = inboxUnread(action.payload.data.folders)
          if (unread !== undefined) state.unreadCount = unread
        }
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
        if (inList && !inList.isRead) adjustInboxUnread(state, -1)
        if (inList) inList.isRead = true
      })
      .addCase(getMessage.rejected, state => {
        state.messageLoading = false
      })
  }
})

export const { clearCurrentMessage, removeMessageFromList, updateMessageFlag } = appEmailSlice.actions

export default appEmailSlice.reducer