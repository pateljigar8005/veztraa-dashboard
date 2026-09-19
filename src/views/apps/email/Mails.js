import { Fragment, useEffect, useState } from 'react'
import MailCard from './MailCard'
import MailDetails from './MailDetails'
import ComposePopUp from './ComposePopup'
import MailCardContextMenu from './MailCardContextMenu'
import toast from 'react-hot-toast'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Menu, Search, Trash2, X } from 'react-feather'
import { Input, InputGroup, InputGroupText, Spinner, Button } from 'reactstrap'
import { confirmDelete } from '@src/utility/confirmDelete'
import { formatRelativeDate } from '@utils'
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
    setReplyTo,
    viewingMailboxId,
    viewingMailboxEmail
  } = props

  const { messages, messagesLoading } = store

  const [selectedUids, setSelectedUids] = useState([])
  useEffect(() => {
    setSelectedUids([])
  }, [store.params.folder, store.params.q])

  const [contextMenu, setContextMenu] = useState(null)
  const handleContextMenu = (e, mail) => {
    if (viewingMailboxId) return
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
    const isScheduled = folder === 'Scheduled'
    confirmDelete({
      title: isScheduled
        ? `Cancel ${selectedUids.length} scheduled email${selectedUids.length === 1 ? '' : 's'}?`
        : `Delete ${selectedUids.length} email${selectedUids.length === 1 ? '' : 's'}?`,
      text: isScheduled
        ? "They won't be sent."
        : folder === 'Trash' ? 'This permanently deletes them.' : "They'll be moved to Trash.",
      onConfirm: () => {
        dispatch(removeMessageFromList(selectedUids))
        dispatch(bulkDeleteMessages({ folder, uids: selectedUids }))
          .unwrap()
          .then(() => {
            toast.success(isScheduled ? 'Scheduled sends cancelled' : folder === 'Trash' ? 'Deleted' : 'Moved to Trash')
            setSelectedUids([])
          })
          .catch(err => toast.error(err?.message || 'Failed to delete'))
      }
    })
  }

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

  const handleMailClick = uid => {
    if (store.params.folder === 'Drafts' && !viewingMailboxId) {
      openComposeFor(uid, 'draft')
      return
    }

    dispatch(clearCurrentMessage())
    dispatch(getMessage({ folder: store.params.folder, uid, adminMailboxId: viewingMailboxId }))
    setOpenMail(true)
  }

  const handleContextDelete = mail => {
    const folder = store.params.folder
    dispatch(removeMessageFromList(mail.uid))
    const action = folder === 'Trash' || folder === 'Scheduled'
      ? deleteMessage({ folder, uid: mail.uid })
      : moveMessage({ folder, uid: mail.uid, to: 'Trash' })
    dispatch(action).then(() =>
      toast.success(folder === 'Scheduled' ? 'Scheduled send cancelled' : folder === 'Trash' ? 'Deleted' : 'Moved to Trash')
    )
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
          {
                                      }
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
            {
                                                                        }
            {store.lastSyncedAt && (
              <span className='text-muted text-nowrap ms-1' style={{ fontSize: '0.75rem' }}>
                Synced {formatRelativeDate(store.lastSyncedAt)}
              </span>
            )}
          </div>
        </div>

        {messages.length > 0 && !viewingMailboxId && (
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
                  folder={store.params.folder}
                  handleMailClick={handleMailClick}
                  selected={selectedUids.includes(mail.uid)}
                  onToggleSelect={toggleSelect}
                  onContextMenu={handleContextMenu}
                  onToggleFlag={handleToggleFlag}
                  readOnly={Boolean(viewingMailboxId)}
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
        viewingMailboxId={viewingMailboxId}
      />
      <ComposePopUp
        composeOpen={composeOpen}
        toggleCompose={toggleCompose}
        replyTo={replyTo}
        adminMailboxId={viewingMailboxId}
        adminMailboxEmail={viewingMailboxEmail}
      />
      {contextMenu && (
        <MailCardContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          deleteLabel={
            store.params.folder === 'Scheduled'
              ? 'Cancel send'
              : store.params.folder === 'Trash'
              ? 'Delete permanently'
              : 'Move to Trash'
          }
          onReply={store.params.folder !== 'Scheduled' ? () => openComposeFor(contextMenu.mail.uid, 'reply') : null}
          onForward={store.params.folder !== 'Scheduled' ? () => openComposeFor(contextMenu.mail.uid, 'forward') : null}
          onArchive={
            store.params.folder !== 'Archive' && store.params.folder !== 'Scheduled'
              ? () => handleContextArchive(contextMenu.mail)
              : null
          }
          onDelete={() => handleContextDelete(contextMenu.mail)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </Fragment>
  )
}

export default Mails