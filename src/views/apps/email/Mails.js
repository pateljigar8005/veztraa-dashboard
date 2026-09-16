// ** React Imports
import { Fragment } from 'react'

// ** Mail Components Imports
import MailCard from './MailCard'
import MailDetails from './MailDetails'
import ComposePopUp from './ComposePopup'

// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Menu, Search } from 'react-feather'

// ** Reactstrap Imports
import { Input, InputGroup, InputGroupText, Spinner } from 'reactstrap'

// ** Store & Actions
import { clearCurrentMessage } from './store'

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

  const handleMailClick = uid => {
    dispatch(clearCurrentMessage())
    dispatch(getMessage({ folder: store.params.folder, uid }))
    setOpenMail(true)
  }

  return (
    <Fragment>
      <div className='email-app-list'>
        <div className='app-fixed-search d-flex align-items-center'>
          <div className='sidebar-toggle d-block d-lg-none ms-1' onClick={() => setSidebarOpen(true)}>
            <Menu size='21' />
          </div>
          <div className='d-flex align-content-center justify-content-between w-100'>
            <InputGroup className='input-group-merge'>
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
                <MailCard key={mail.uid} mail={mail} handleMailClick={handleMailClick} />
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
    </Fragment>
  )
}

export default Mails
