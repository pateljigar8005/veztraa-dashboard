// ** React Imports
import { useParams, useNavigate } from 'react-router-dom'
import { Fragment, useEffect, useState } from 'react'

// ** Email App Component Imports
import Mails from './Mails'
import Sidebar from './Sidebar'

// ** Hooks
import useDebounce from '@hooks/useDebounce'

// ** Third Party Components
import classnames from 'classnames'

// ** Shared Components
import AdvancedSearchModal from '../shared/AdvancedSearchModal'

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux'
import { getFolderView, getMessage, clearCurrentMessage } from './store'

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

  // ** Toggle Compose Function
  const toggleCompose = () => {
    if (composeOpen) setReplyTo(null)
    setComposeOpen(!composeOpen)
  }

  // ** Store Variables
  const dispatch = useDispatch()
  const store = useSelector(state => state.email)

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
    dispatch(getFolderView({ folder, q: debouncedQuery, filters }))
    if (routeUid) {
      dispatch(getMessage({ folder, uid: Number(routeUid) }))
      setOpenMail(true)
    } else {
      dispatch(clearCurrentMessage())
      setOpenMail(false)
    }
  }, [folder, debouncedQuery, filters])

  // ** Keeps the URL's uid segment in sync with whatever message is
  // actually open, so a reload can restore it (see the effect above).
  // Deliberately does nothing while openMail is true but the message hasn't
  // loaded yet, rather than stripping the uid the moment currentMessage is
  // momentarily null - that would erase the very param this is meant to
  // preserve during the fetch that follows a reload. `replace: true` avoids
  // stacking a history entry per email opened.
  useEffect(() => {
    if (!openMail) {
      if (routeUid) navigate(`/email/${folder}`, { replace: true })
      return
    }
    if (store.currentMessage?.uid && String(store.currentMessage.uid) !== routeUid) {
      navigate(`/email/${folder}/${store.currentMessage.uid}`, { replace: true })
    }
  }, [openMail, store.currentMessage])

  // ** The navbar refresh icon forwards its click here instead of doing a
  // full browser reload (see NavbarBookmarks.js's isEmailRoute handling) -
  // re-fetches the current folder's messages and the folder/unread-count list.
  const handleRefresh = () => {
    dispatch(getFolderView({ folder, q: debouncedQuery, filters }))
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
          />
        </div>
      </div>
    </Fragment>
  )
}

export default EmailApp
