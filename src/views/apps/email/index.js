// ** React Imports
import { useParams } from 'react-router-dom'
import { Fragment, useEffect, useState } from 'react'

// ** Email App Component Imports
import Mails from './Mails'
import Sidebar from './Sidebar'

// ** Hooks
import useDebounce from '@hooks/useDebounce'

// ** Third Party Components
import classnames from 'classnames'

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux'
import { getFolderView, getMessage, clearCurrentMessage } from './store'

// ** Styles
import '@styles/react/apps/app-email.scss'

const EmailApp = () => {
  // ** States
  const [query, setQuery] = useState('')
  const [openMail, setOpenMail] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [replyTo, setReplyTo] = useState(null)

  // ** Toggle Compose Function
  const toggleCompose = () => {
    if (composeOpen) setReplyTo(null)
    setComposeOpen(!composeOpen)
  }

  // ** Store Variables
  const dispatch = useDispatch()
  const store = useSelector(state => state.email)

  // ** Vars
  const params = useParams()
  const folder = params.folder || 'INBOX'
  const debouncedQuery = useDebounce(query, 400)

  // ** Fetch folders + this folder's messages together (one login instead of
  // two - see getFolderView) whenever the folder or search changes, including
  // on first mount.
  useEffect(() => {
    dispatch(getFolderView({ folder, q: debouncedQuery }))
    dispatch(clearCurrentMessage())
    setOpenMail(false)
  }, [folder, debouncedQuery])

  // ** The navbar refresh icon forwards its click here instead of doing a
  // full browser reload (see NavbarBookmarks.js's isEmailRoute handling) -
  // re-fetches the current folder's messages and the folder/unread-count list.
  const handleRefresh = () => {
    dispatch(getFolderView({ folder, q: debouncedQuery }))
  }

  return (
    <Fragment>
      <button id='email-refresh-trigger' type='button' hidden onClick={handleRefresh} />
      <Sidebar
        store={store}
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
