// ** React Imports
import { useParams, useNavigate } from 'react-router-dom'
import { Fragment, useEffect, useState } from 'react'

// ** Email App Component Imports
import Mails from './Mails'
import Sidebar from './Sidebar'

// ** Hooks
import useDebounce from '@hooks/useDebounce'

// ** Third Party Components
import axios from 'axios'
import classnames from 'classnames'

// ** Shared Components
import AdvancedSearchModal from '../shared/AdvancedSearchModal'

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux'
import { getFolderView, getMessage, clearCurrentMessage } from './store'

// ** Utils
import { getUserData } from '@utils'

// ** Styles
import '@styles/react/apps/app-email.scss'

// ** Advanced search fields - From/To/Subject match the same cached
// subject/from/to columns the plain search box already searches (see
// MailboxController::buildMessagesList()), so these combine with each other
// (and with whatever's typed in the search box) rather than replacing it.
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
  // ** States
  const [query, setQuery] = useState('')
  const [openMail, setOpenMail] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [filters, setFilters] = useState({})
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  // Admin-only "browse as" mailbox picker (see Sidebar.js and
  // AdminMailboxController) - null means the normal "my own mailbox" view.
  // Deliberately kept as plain local state, not reflected in the URL/route
  // the way folder/uid are - this is a temporary browsing session, not
  // something meant to be bookmarked or deep-linked.
  const isAdmin = (getUserData()?.role || '').toLowerCase() === 'admin'
  const [viewingMailboxId, setViewingMailboxId] = useState(null)
  const [mailboxOptions, setMailboxOptions] = useState([])

  // ** Toggle Compose Function
  const toggleCompose = () => {
    if (composeOpen) setReplyTo(null)
    setComposeOpen(!composeOpen)
  }

  // ** Store Variables
  const dispatch = useDispatch()
  const store = useSelector(state => state.email)

  // ** Admin Emails (see Company Settings) for the sidebar's mailbox picker -
  // fetched once, admin only.
  useEffect(() => {
    if (!isAdmin) return
    axios.get('/company-mailboxes').then(response => {
      const mailboxes = response.data?.data?.companyMailboxes || []
      setMailboxOptions(
        mailboxes.map(m => ({ value: m.id, label: m.label ? `${m.label} (${m.email})` : m.email, email: m.email }))
      )
    })
  }, [])

  // The picked option's own real address - threaded down to Compose (see
  // ComposePopup's own adminMailboxId/adminMailboxEmail props) so it can
  // show which identity a reply/forward/new message will actually send as.
  const viewingMailboxEmail = mailboxOptions.find(o => o.value === viewingMailboxId)?.email || null

  // ** Vars - route is '/email/*' (see Apps.js), so folder/uid come from
  // splitting the splat rather than named path params.
  const params = useParams()
  const navigate = useNavigate()
  const [routeFolder, routeUid] = (params['*'] || '').split('/').filter(Boolean)
  const folder = routeFolder || 'INBOX'
  const debouncedQuery = useDebounce(query, 400)

  // ** Fetch folders + this folder's messages together (one login instead of
  // two - see getFolderView) whenever the folder or search changes, including
  // on first mount. A uid in the URL at that point (see the sync effect
  // below, and the route's splat in Apps.js) means a reload happened while a
  // message was open - reopen that same message instead of always landing
  // back on the plain list. Switching folders via the sidebar navigates to a
  // plain /email/:folder path with no uid segment, so this only ever fires
  // the restore branch on an actual page load.
  useEffect(() => {
    dispatch(getFolderView({ folder, q: debouncedQuery, filters, adminMailboxId: viewingMailboxId }))
    // A uid restored from the URL only makes sense for the normal "my own
    // mailbox" view - viewingMailboxId is plain local state (see its own
    // note above), so it's already lost by the time a reload gets here,
    // and trying to reopen that uid would silently fetch a same-numbered
    // but unrelated message from the wrong mailbox instead. See the
    // URL-sync effect below, which matches this by never writing a uid
    // into the URL while an admin mailbox is selected in the first place.
    if (routeUid && !viewingMailboxId) {
      dispatch(getMessage({ folder, uid: Number(routeUid) }))
      setOpenMail(true)
    } else {
      dispatch(clearCurrentMessage())
      setOpenMail(false)
    }
  }, [folder, debouncedQuery, filters, viewingMailboxId])

  // ** Keeps the URL's uid segment in sync with whatever message is
  // actually open, so a reload can restore it (see the effect above).
  // Deliberately does nothing while openMail is true but the message hasn't
  // loaded yet, rather than stripping the uid the moment currentMessage is
  // momentarily null - that would erase the very param this is meant to
  // preserve during the fetch that follows a reload. `replace: true` avoids
  // stacking a history entry per email opened. Skipped entirely while
  // browsing an admin mailbox (see the effect above's own note).
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

  // ** The navbar refresh icon forwards its click here instead of doing a
  // full browser reload (see NavbarBookmarks.js's isEmailRoute handling) -
  // re-fetches the current folder's messages and the folder/unread-count list.
  const handleRefresh = () => {
    dispatch(getFolderView({ folder, q: debouncedQuery, filters, adminMailboxId: viewingMailboxId }))
  }

  // ** Sidebar's mailbox picker - switching (or clearing back to "My
  // Mailbox") always lands back on Inbox, since 'Scheduled' isn't a real
  // IMAP folder AdminMailboxController supports (see its own guardFolder()),
  // and whatever folder was open otherwise may not mean much in a different
  // mailbox's context either.
  const handleSelectMailbox = option => {
    setViewingMailboxId(option ? option.value : null)
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
