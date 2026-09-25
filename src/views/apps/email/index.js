import { useParams, useNavigate } from 'react-router-dom'
import { Fragment, useEffect, useState } from 'react'
import Mails from './Mails'
import Sidebar from './Sidebar'
import useDebounce from '@hooks/useDebounce'
import axios from 'axios'
import classnames from 'classnames'
import AdvancedSearchModal from '../shared/AdvancedSearchModal'
import { useDispatch, useSelector } from 'react-redux'
import { getFolderView, getMessage, clearCurrentMessage, readStoredMailboxId, storeMailboxId } from './store'
import { getUserData, sortOptions } from '@utils'
import '@styles/react/apps/app-email.scss'

// Matches useEmailUnreadPolling's cadence for the sidebar badge. Without
// this, a message cached straight into the inbox the instant an internal
// sender sends it (see the API's MailboxOutbox received-placeholder feature)
// would never actually show up in an already-open list - it only ever
// refetches today on folder/query change or during the narrow move-
// placeholder retry window.
const LIST_POLL_INTERVAL_MS = 15000

const searchFields = [
  { name: 'from', label: 'From', type: 'text' },
  { name: 'to', label: 'To', type: 'text' },
  { name: 'subject', label: 'Subject', type: 'text' },
  { name: 'date', label: 'Date', type: 'date-range' },
  {
    name: 'unread',
    label: 'Read Status',
    type: 'select',
    options: [
      { value: '1', label: 'Unread only' },
      { value: '0', label: 'Read only' }
    ]
  },
  {
    name: 'flagged',
    label: 'Flagged',
    type: 'select',
    options: [{ value: '1', label: 'Flagged only' }]
  }
]

const EmailApp = () => {
  const [query, setQuery] = useState('')
  const [openMail, setOpenMail] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [filters, setFilters] = useState({})
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const isAdmin = (getUserData()?.role || '').toLowerCase() === 'admin'
  const params = useParams()
  const [viewingMailboxId, setViewingMailboxId] = useState(() => {
    const [initialFolder] = (params['*'] || '').split('/').filter(Boolean)
    // Scheduled belongs to the user's own mailbox only.
    return isAdmin && initialFolder !== 'Scheduled' ? readStoredMailboxId() : null
  })
  const [mailboxOptions, setMailboxOptions] = useState([])

  const toggleCompose = () => {
    if (composeOpen) setReplyTo(null)
    setComposeOpen(!composeOpen)
  }

  const dispatch = useDispatch()
  const store = useSelector(state => state.email)

  useEffect(() => {
    if (!isAdmin) return
    axios.get('/company-mailboxes').then(response => {
      const mailboxes = response.data?.data?.companyMailboxes || []
      setMailboxOptions(
        sortOptions(mailboxes.map(m => ({ value: m.id, label: m.label ? `${m.label} (${m.email})` : m.email, email: m.email })))
      )
      // A remembered mailbox that's since been deleted falls back to My Mailbox.
      setViewingMailboxId(current => {
        if (current && !mailboxes.some(m => m.id === current)) {
          storeMailboxId(null)
          return null
        }
        return current
      })
    })
  }, [])

  const viewingMailboxEmail = mailboxOptions.find(o => o.value === viewingMailboxId)?.email || null

  const navigate = useNavigate()
  const [routeFolder, routeUid] = (params['*'] || '').split('/').filter(Boolean)
  const folder = routeFolder || 'INBOX'
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    dispatch(getFolderView({ folder, q: debouncedQuery, filters, adminMailboxId: viewingMailboxId }))
    if (routeUid && !viewingMailboxId) {
      dispatch(getMessage({ folder, uid: Number(routeUid) }))
      setOpenMail(true)
    } else {
      dispatch(clearCurrentMessage())
      setOpenMail(false)
    }
  }, [folder, debouncedQuery, filters, viewingMailboxId])

  useEffect(() => {
    const poll = () => {
      if (document.hidden) return
      dispatch(getFolderView({ folder, q: debouncedQuery, filters, adminMailboxId: viewingMailboxId, silent: true }))
    }
    const timer = setInterval(poll, LIST_POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', poll)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [folder, debouncedQuery, filters, viewingMailboxId])

  useEffect(() => {
    if (viewingMailboxId) return
    if (!openMail) {
      if (routeUid) navigate(`/email/${folder}`, { replace: true })
      return
    }
    if (store.currentMessage?.uid && String(store.currentMessage.uid) !== routeUid) {
      navigate(`/email/${folder}/${store.currentMessage.uid}`, { replace: true })
    }
  }, [openMail, store.currentMessage, viewingMailboxId])

  const handleRefresh = () => {
    dispatch(getFolderView({ folder, q: debouncedQuery, filters, adminMailboxId: viewingMailboxId }))
  }

  const handleSelectMailbox = option => {
    setViewingMailboxId(option ? option.value : null)
    storeMailboxId(option ? option.value : null)
    setOpenMail(false)
    if (folder !== 'INBOX') navigate('/email/INBOX')
  }

  return (
    <Fragment>
      <button id='email-refresh-trigger' type='button' hidden onClick={handleRefresh} />
      <button
        id='navbar-advanced-search-trigger'
        type='button'
        hidden
        onClick={() => setAdvancedSearchOpen(true)}
      />
      <AdvancedSearchModal
        isOpen={advancedSearchOpen}
        toggle={() => setAdvancedSearchOpen(!advancedSearchOpen)}
        title='Advanced Email Search'
        fields={searchFields}
        values={filters}
        onApply={setFilters}
        onClear={() => setFilters({})}
      />
      <Sidebar
        store={store}
        activeFolder={folder}
        setOpenMail={setOpenMail}
        sidebarOpen={sidebarOpen}
        toggleCompose={toggleCompose}
        setSidebarOpen={setSidebarOpen}
        isAdmin={isAdmin}
        mailboxOptions={mailboxOptions}
        viewingMailboxId={viewingMailboxId}
        onSelectMailbox={handleSelectMailbox}
      />
      <div className='content-right'>
        <div className='content-body'>
          <div
            className={classnames('body-content-overlay', {
              show: sidebarOpen
            })}
            onClick={() => setSidebarOpen(false)}
          ></div>
          <Mails
            store={store}
            query={query}
            setQuery={setQuery}
            dispatch={dispatch}
            openMail={openMail}
            setOpenMail={setOpenMail}
            composeOpen={composeOpen}
            toggleCompose={toggleCompose}
            setSidebarOpen={setSidebarOpen}
            getMessage={getMessage}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            viewingMailboxId={viewingMailboxId}
            viewingMailboxEmail={viewingMailboxEmail}
          />
        </div>
      </div>
    </Fragment>
  )
}

export default EmailApp