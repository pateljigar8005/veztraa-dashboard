// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

// ** Dispatched as a background badge-count refresh from several other
// thunks below (getMessage, setMessageRead, moveMessage, ...) - getMessage's
// case in particular is always immediately followed by a route change (see
// index.js's own effect syncing the opened message's uid into the URL).
// RouteRequestCanceller's own "abort every GET tagged with the path you just
// left" (see axiosConfig.js) runs synchronously right after that navigation,
// which reliably wins the race against this (network-bound) request still
// being in flight - so this exact call would otherwise get cancelled on
// nearly every message open, silently leaving the sidebar's unread badge
// stale. Opting out with an explicit (never-aborted) signal - the same
// escape hatch axiosConfig.js's own interceptor already exposes via its
// `!config.signal` check - since this is a background refresh that should
// always finish, not a page-load fetch tied to the page being left.
export const getFolders = createAsyncThunk('appEmail/getFolders', async () => {
  const response = await axios.get('/mailbox/folders', { signal: new AbortController().signal })
  return response.data.data.folders
})

export const getMessages = createAsyncThunk('appEmail/getMessages', async params => {
  const response = await axios.get(`/mailbox/${params.folder}/messages`, {
    params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '', ...params.filters }
  })
  return { params, data: response.data.data }
})

// ** Combined folders + message-list fetch (one IMAP login instead of two) -
// used for the common "open/switch to a folder" flow. Each request to our
// mail server pays a real, sometimes multi-second login cost (see the
// backend's MailboxController::view() for the measured breakdown), so
// halving how many separate logins a single page view needs is a real win.
// Advanced-search filters (see AdvancedSearchModal in index.js) are spread
// directly into the query params, the same convention every other module's
// getData() thunk already uses.
export const getFolderView = createAsyncThunk('appEmail/getFolderView', async params => {
  const response = await axios.get(`/mailbox/${params.folder}/view`, {
    params: { page: params.page || 1, perPage: params.perPage || 20, q: params.q || '', ...params.filters }
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

// ** Deletes multiple selected messages in one request instead of looping
// deleteMessage per uid - each request to our mail server pays a real login
// cost (see MailboxController::bulkDelete()), so batching this server-side
// matters a lot more here than it would against a typical fast API.
export const bulkDeleteMessages = createAsyncThunk(
  'appEmail/bulkDeleteMessages',
  async ({ folder, uids }, { dispatch, getState }) => {
    await axios.post(`/mailbox/${folder}/messages/bulk-delete`, { uids })
    await dispatch(getMessages(getState().email.params))
    dispatch(getFolders())
    return uids
  }
)

export const sendMessage = createAsyncThunk('appEmail/sendMessage', async message => {
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

  // The actual send now happens in the background (see
  // MailboxController::send()) - this response just confirms it was queued,
  // not that it's actually in Sent yet, so refetching a Sent-folder view
  // immediately here would only show it as still missing. The list catches
  // up on its own the next time its cache goes stale (or sooner, since the
  // background worker updates the Sent cache directly once it finishes).
  const response = await axios.post('/mailbox/send', payload)
  return response.data
})

// ** Saves the compose form as a draft - a plain IMAP APPEND into Drafts, no
// SMTP involved (see MailboxController::saveDraft()). Pass the draft's own
// uid (from a previous save) to replace it instead of creating a new copy
// each time - IMAP has no in-place edit, so the backend deletes the old one
// and returns a NEW uid, which the caller must start tracking from here on.
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

// ** Star/unstar a message - same immediate-cache-then-queue backend flow as
// setMessageRead (see MailboxController::toggleFlag()), so the list is
// updated optimistically here (see the reducer below) rather than waiting on
// this round trip or refetching the whole list for one flag bit.
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
    lastSyncedAt: null
  },
  reducers: {
    clearCurrentMessage: state => {
      state.currentMessage = null
    },
    // Optimistically drops one or more messages (a single uid, or an array
    // for a bulk action) from whatever list is currently showing - e.g. a
    // draft the instant it's sent (see ComposePopup), or a delete/move/
    // archive/bulk-delete the instant it's actioned (see Mails.js) - since
    // the real IMAP change only happens moments later in the background
    // (see MailboxActions/MailboxOutbox) and waiting for that to actually
    // finish before updating the list would defeat the point of queuing it
    // in the first place. A no-op for anything not in the currently-loaded
    // list at all (e.g. actioned from a different folder view).
    removeMessageFromList: (state, action) => {
      const uids = new Set([].concat(action.payload))
      const before = state.messages.length
      state.messages = state.messages.filter(m => !uids.has(m.uid))
      state.total = Math.max(0, state.total - (before - state.messages.length))
    },
    // Flips isFlagged on one message in whatever list is currently showing,
    // the instant the star is clicked - same optimistic-first reasoning as
    // removeMessageFromList (the real IMAP flag change is only queued, see
    // MailboxActions), and also keeps the open detail view (if this message
    // happens to be it) in sync without a separate refetch.
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
        if (inList) inList.isRead = true
      })
      .addCase(getMessage.rejected, state => {
        state.messageLoading = false
      })
  }
})

export const { clearCurrentMessage, removeMessageFromList, updateMessageFlag } = appEmailSlice.actions

export default appEmailSlice.reducer
