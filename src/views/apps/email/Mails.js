import { Fragment, useEffect, useRef, useState } from 'react'
import MailCard from './MailCard'
import MailDetails from './MailDetails'
import ComposePopUp from './ComposePopup'
import MailCardContextMenu from './MailCardContextMenu'
import toast from 'react-hot-toast'
import PerfectScrollbar from 'react-perfect-scrollbar'
import ReactPaginate from 'react-paginate'
import { Menu, Search } from 'react-feather'
import { Input, InputGroup, InputGroupText, Spinner, Button } from 'reactstrap'
import { confirmDelete } from '@src/utility/confirmDelete'
import { formatRelativeDate } from '@utils'
import {
  clearCurrentMessage,
  getMessages,
  bulkDeleteMessages,
  moveMessage,
  deleteMessage,
  removeMessageFromList,
  toggleFlag,
  updateMessageFlag,
  setSelectedUids as setSelectedUidsAction
} from './store'

// Mail just moved (e.g. to Trash) shows in the destination folder under a
// temporary id until the background move finishes. The API resolves that to
// the real message (waiting for the move if needed), so it can be opened,
// deleted or moved like any other - the list just refreshes itself until the
// real rows arrive.
const PLACEHOLDER_UID_MIN = 4000000000
// Just-sent mail (Sent list) uses a higher band; it CAN be opened - the API
// serves its details from the queued message - but not deleted/moved until
// the send finishes.
const SENDING_UID_MIN = 4200000000
const isMoving = uid => uid >= PLACEHOLDER_UID_MIN
const isSending = uid => uid >= SENDING_UID_MIN
const SENDING_MESSAGE = 'Still sending - try again in a few seconds.'

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

  // Lives in the email slice, not local state - see setSelectedUids' own
  // comment (store/index.js) for why: the navbar's bulk-delete icon
  // (NavbarBookmarks.js) needs to read the ticked count too, same idea as
  // Activity Log's selectedIds. This local wrapper keeps every call site
  // below (setSelectedUids(prev => ...) / setSelectedUids([])) unchanged.
  const selectedUids = store.selectedUids
  const setSelectedUids = updater => {
    dispatch(setSelectedUidsAction(typeof updater === 'function' ? updater(selectedUids) : updater))
  }

  useEffect(() => {
    setSelectedUids([])
  }, [store.params.folder, store.params.q])

  useEffect(() => {
    setSelectedUids(prev => {
      const next = prev.filter(uid => messages.some(m => m.uid === uid))
      return next.length === prev.length ? prev : next
    })
  }, [messages])

  const page = store.params.page || 1
  const perPage = store.params.perPage || 20
  const totalPages = Math.max(1, Math.ceil((store.total || 0) / perPage))

  const goToPage = target => {
    setSelectedUids([])
    dispatch(getMessages({ ...store.params, page: target }))
  }

  // Deleting the last item on a later page leaves it empty - step back to
  // the last page that still has mail instead of showing "No Items Found".
  useEffect(() => {
    if (messagesLoading || messages.length > 0 || !store.total || page <= 1) return
    const target = Math.min(page, totalPages)
    if (target !== page) goToPage(target)
  }, [messages, messagesLoading, store.total])

  // While moved mail is still under its temporary id, quietly re-read the
  // list every few seconds so the real rows replace it. Capped in case the
  // background move failed and the placeholder never resolves.
  const hasMoving = messages.some(m => isMoving(m.uid))
  const refreshAttempts = useRef(0)
  useEffect(() => {
    if (!hasMoving) {
      refreshAttempts.current = 0
      return
    }
    if (messagesLoading || refreshAttempts.current >= 15) return
    const timer = setTimeout(() => {
      refreshAttempts.current += 1
      dispatch(getMessages({ ...store.params, silent: true }))
    }, 3000)
    return () => clearTimeout(timer)
  }, [hasMoving, messages, messagesLoading])

  const [contextMenu, setContextMenu] = useState(null)
  const handleContextMenu = (e, mail) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, mail })
  }

  const toggleSelect = uid => {
    setSelectedUids(prev => (prev.includes(uid) ? prev.filter(u => u !== uid) : [...prev, uid]))
  }

  const handleBulkDelete = () => {
    const folder = store.params.folder
    const isScheduled = folder === 'Scheduled'
    const actionable = selectedUids.filter(uid => !isSending(uid))
    if (!actionable.length) {
      toast.error(SENDING_MESSAGE)
      return
    }
    confirmDelete({
      title: isScheduled
        ? `Cancel ${actionable.length} scheduled email${actionable.length === 1 ? '' : 's'}?`
        : `Delete ${actionable.length} email${actionable.length === 1 ? '' : 's'}?`,
      text: isScheduled
        ? "They won't be sent."
        : folder === 'Trash' ? 'This permanently deletes them.' : "They'll be moved to Trash.",
      onConfirm: () => {
        const uids = actionable
        setSelectedUids([])
        if (actionable.length < selectedUids.length) toast.error('Some emails are still sending and were skipped.')
        dispatch(removeMessageFromList(uids))
        dispatch(bulkDeleteMessages({ folder, uids }))
          .unwrap()
          .then(() => {
            toast.success(isScheduled ? 'Scheduled sends cancelled' : folder === 'Trash' ? 'Deleted' : 'Moved to Trash')
          })
          .catch(err => toast.error(err?.message || 'Failed to delete'))
      }
    })
  }

  const openComposeFor = (uid, mode) => {
    setReplyTo({ uid, mode, loading: true })
    toggleCompose()
    dispatch(getMessage({ folder: store.params.folder, uid, adminMailboxId: viewingMailboxId }))
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
    if (isSending(mail.uid)) {
      toast.error(SENDING_MESSAGE)
      return
    }
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
    if (isSending(mail.uid)) {
      toast.error(SENDING_MESSAGE)
      return
    }
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
            {/* Same hidden-trigger pattern as Activity Log's own bulk-delete
                icon (NavbarBookmarks.js's bulkDeleteRoute) - only does
                anything once rows are ticked (handleBulkDelete no-ops
                otherwise). */}
            <Button id='email-bulk-delete-btn' className='d-none' onClick={handleBulkDelete}>
              Delete selected
            </Button>
            {store.lastSyncedAt && (
              <span className='text-muted text-nowrap ms-1' style={{ fontSize: '0.75rem' }}>
                Synced {formatRelativeDate(store.lastSyncedAt)}
              </span>
            )}
          </div>
        </div>

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

        {store.total > perPage && (
          <div className='email-pager'>
            <ReactPaginate
              previousLabel={''}
              nextLabel={''}
              pageCount={totalPages}
              activeClassName='active'
              forcePage={page - 1}
              onPageChange={({ selected }) => goToPage(selected + 1)}
              pageClassName={'page-item'}
              nextLinkClassName={'page-link'}
              nextClassName={'page-item next'}
              previousClassName={'page-item prev'}
              previousLinkClassName={'page-link'}
              pageLinkClassName={'page-link'}
              containerClassName={'pagination react-paginate justify-content-end my-50 pe-1'}
            />
          </div>
        )}
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