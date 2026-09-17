// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** Mail Components Imports
import MailCard from './MailCard'
import MailDetails from './MailDetails'
import ComposePopUp from './ComposePopup'
import MailCardContextMenu from './MailCardContextMenu'

// ** Third Party Components
import toast from 'react-hot-toast'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Menu, Search, Trash2, X } from 'react-feather'

// ** Reactstrap Imports
import { Input, InputGroup, InputGroupText, Spinner, Button } from 'reactstrap'

// ** Utils
import { confirmDelete } from '@src/utility/confirmDelete'
import { formatRelativeDate } from '@utils'

// ** Store & Actions
import {
  clearCurrentMessage,
  bulkDeleteMessages,
  moveMessage,
  deleteMessage,
  removeMessageFromList,
  toggleFlag,
  updateMessageFlag
} from './store'

const Mails = props => {
  // ** Props
  const {
    query,
    store,
    openMail,
    setQuery,
    dispatch,
    composeOpen,
    setOpenMail,
    toggleCompose,
    setSidebarOpen,
    getMessage,
    replyTo,
    setReplyTo
  } = props

  const { messages, messagesLoading } = store

  // ** Selection state - cleared whenever the folder/search changes so a
  // stale selection never survives into a different message list.
  const [selectedUids, setSelectedUids] = useState([])
  useEffect(() => {
    setSelectedUids([])
  }, [store.params.folder, store.params.q])

  // ** Right-click context menu (Reply/Forward/Archive/Delete) - null when
  // closed, otherwise the cursor position plus which mail it's for.
  const [contextMenu, setContextMenu] = useState(null)
  const handleContextMenu = (e, mail) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, mail })
  }

  const toggleSelect = uid => {
    setSelectedUids(prev => (prev.includes(uid) ? prev.filter(u => u !== uid) : [...prev, uid]))
  }

  const toggleSelectAll = () => {
    setSelectedUids(prev => (prev.length === messages.length ? [] : messages.map(m => m.uid)))
  }

  const handleBulkDelete = () => {
    const folder = store.params.folder
    confirmDelete({
      title: `Delete ${selectedUids.length} email${selectedUids.length === 1 ? '' : 's'}?`,
      text: folder === 'Trash' ? 'This permanently deletes them.' : "They'll be moved to Trash.",
      onConfirm: () => {
        dispatch(removeMessageFromList(selectedUids))
        dispatch(bulkDeleteMessages({ folder, uids: selectedUids }))
          .unwrap()
          .then(() => {
            toast.success(folder === 'Trash' ? 'Deleted' : 'Moved to Trash')
            setSelectedUids([])
          })
          .catch(err => toast.error(err?.message || 'Failed to delete'))
      }
    })
  }

  // Opens Compose in the given mode (draft/reply/forward) for a message
  // that's only ever a live IMAP fetch away (bodies are never cached, one
  // cached-draft exception aside - see MailboxCache::getDraftContent()) -
  // the popup opens immediately showing a loading state (see ComposePopup's
  // replyTo.loading handling) instead of leaving the click looking
  // unresponsive until that fetch resolves.
  const openComposeFor = (uid, mode) => {
    setReplyTo({ uid, mode, loading: true })
    toggleCompose()
    dispatch(getMessage({ folder: store.params.folder, uid }))
      .unwrap()
      .then(msg => setReplyTo({ ...msg, mode }))
      .catch(err => {
        toast.error(err?.message || 'Failed to open message')
        toggleCompose()
      })
  }

  // A draft isn't something you read - clicking one reopens it for editing
  // instead of the read-only detail view every other folder uses.
  const handleMailClick = uid => {
    if (store.params.folder === 'Drafts') {
      openComposeFor(uid, 'draft')
      return
    }

    dispatch(clearCurrentMessage())
    dispatch(getMessage({ folder: store.params.folder, uid }))
    setOpenMail(true)
  }

  // ** Context menu actions - same folder-aware "Trash = permanent delete,
  // anywhere else = move to Trash" logic as MailDetails' own delete button.
  // The backend now only ever updates its cache + queues the real IMAP
  // change before responding (see MailboxActions) rather than waiting on a
  // live connection, but removing it from the list here too, immediately,
  // means this doesn't even wait on that (now fast) round trip.
  const handleContextDelete = mail => {
    const folder = store.params.folder
    dispatch(removeMessageFromList(mail.uid))
    const action = folder === 'Trash' ? deleteMessage({ folder, uid: mail.uid }) : moveMessage({ folder, uid: mail.uid, to: 'Trash' })
    dispatch(action).then(() => toast.success(folder === 'Trash' ? 'Deleted' : 'Moved to Trash'))
  }

  const handleContextArchive = mail => {
    const folder = store.params.folder
    dispatch(removeMessageFromList(mail.uid))
    dispatch(moveMessage({ folder, uid: mail.uid, to: 'Archive' })).then(() => toast.success('Archived'))
  }

  const handleToggleFlag = mail => {
    const folder = store.params.folder
    const flagged = !mail.isFlagged
    dispatch(updateMessageFlag({ uid: mail.uid, flagged }))
    dispatch(toggleFlag({ folder, uid: mail.uid, flagged }))
  }

  return (
    <Fragment>
      <div className='email-app-list'>
        <div className='app-fixed-search d-flex align-items-center'>
          <div className='sidebar-toggle d-block d-lg-none ms-1' onClick={() => setSidebarOpen(true)}>
            <Menu size='21' />
          </div>
          <div className='d-flex align-items-center justify-content-between w-100'>
            <InputGroup className='input-group-merge flex-grow-1'>
              <InputGroupText>
                <Search className='text-muted' size={14} />
              </InputGroupText>
              <Input
                id='email-search'
                placeholder='Search email'
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </InputGroup>
            {/* When this folder's cache was last actually refreshed from the
                mail server (see MailboxCache::getLastSyncedAt()) - always
                shown regardless of search state. A live search bypasses the
                cache for its own results, but this still reflects a real,
                meaningful fact (when the cache was last refreshed), so
                there's no reason to hide it just because a search is active. */}
            {store.lastSyncedAt && (
              <span className='text-muted text-nowrap ms-1' style={{ fontSize: '0.75rem' }}>
                Synced {formatRelativeDate(store.lastSyncedAt)}
              </span>
            )}
          </div>
        </div>

        {messages.length > 0 && (
          <div className='app-action'>
            <div className='form-check d-flex align-items-center' style={{ gap: '0.75rem' }}>
              <Input
                type='checkbox'
                checked={selectedUids.length === messages.length}
                onChange={toggleSelectAll}
              />
              <span className='fw-bold' style={{ visibility: selectedUids.length > 0 ? 'visible' : 'hidden' }}>
                {selectedUids.length} selected
              </span>
            </div>
            <div className='action-right' style={{ visibility: selectedUids.length > 0 ? 'visible' : 'hidden' }}>
              <Button color='flat-danger' size='sm' onClick={handleBulkDelete}>
                <Trash2 size={14} className='me-50' />
                Delete
              </Button>
              <Button color='flat-secondary' size='sm' onClick={() => setSelectedUids([])}>
                <X size={14} className='me-50' />
                Clear
              </Button>
            </div>
          </div>
        )}

        <PerfectScrollbar className='email-user-list' options={{ wheelPropagation: false }}>
          {messagesLoading ? (
            <div className='d-flex justify-content-center align-items-center py-5'>
              <Spinner color='primary' />
            </div>
          ) : messages.length ? (
            <ul className='email-media-list'>
              {messages.map(mail => (
                <MailCard
                  key={mail.uid}
                  mail={mail}
                  handleMailClick={handleMailClick}
                  selected={selectedUids.includes(mail.uid)}
                  onToggleSelect={toggleSelect}
                  onContextMenu={handleContextMenu}
                  onToggleFlag={handleToggleFlag}
                />
              ))}
            </ul>
          ) : (
            <div className='no-results d-block'>
              <h5>No Items Found</h5>
            </div>
          )}
        </PerfectScrollbar>
      </div>
      <MailDetails
        openMail={openMail}
        dispatch={dispatch}
        mail={store.currentMessage}
        loading={store.messageLoading}
        folder={store.params.folder}
        setOpenMail={setOpenMail}
        toggleCompose={toggleCompose}
        setReplyTo={setReplyTo}
      />
      <ComposePopUp composeOpen={composeOpen} toggleCompose={toggleCompose} replyTo={replyTo} />
      {contextMenu && (
        <MailCardContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          deleteLabel={store.params.folder === 'Trash' ? 'Delete permanently' : 'Move to Trash'}
          onReply={() => openComposeFor(contextMenu.mail.uid, 'reply')}
          onForward={() => openComposeFor(contextMenu.mail.uid, 'forward')}
          onArchive={store.params.folder !== 'Archive' ? () => handleContextArchive(contextMenu.mail) : null}
          onDelete={() => handleContextDelete(contextMenu.mail)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </Fragment>
  )
}

export default Mails
