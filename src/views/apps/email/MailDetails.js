// ** React Imports
import { Fragment } from 'react'

// ** Utils
import { formatDate } from '@utils'

// ** Custom Components
import Avatar from '@components/avatar'
import EmailBodyFrame from './EmailBodyFrame'

// ** Third Party Components
import classnames from 'classnames'
import toast from 'react-hot-toast'

import { Mail, Paperclip, ChevronLeft, CornerUpLeft, CornerUpRight, Trash2, Folder } from 'react-feather'
import PerfectScrollbar from 'react-perfect-scrollbar'

// ** Reactstrap Imports
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  DropdownMenu,
  DropdownItem,
  DropdownToggle,
  UncontrolledDropdown,
  Spinner
} from 'reactstrap'

// ** Store & Actions
import { setMessageRead, moveMessage, deleteMessage } from './store'

// ** Every real IMAP folder a message can be moved to (see backend
// Mailbox::FOLDERS), keyed by the same folder key the API expects.
const MOVE_TARGETS = [
  { key: 'INBOX', label: 'Inbox' },
  { key: 'Drafts', label: 'Drafts' },
  { key: 'Trash', label: 'Trash' }
]

const MailDetails = props => {
  // ** Props
  const { mail, loading, folder, openMail, dispatch, setOpenMail, toggleCompose, setReplyTo } = props

  const handleGoBack = () => setOpenMail(false)

  const handleReply = () => {
    setReplyTo(mail)
    toggleCompose()
  }

  const handleMove = to => {
    dispatch(moveMessage({ folder, uid: mail.uid, to })).then(() => {
      toast.success(`Moved to ${to}`)
      handleGoBack()
    })
  }

  const handleDelete = () => {
    // From Trash, "delete" is permanent - anywhere else it's the usual
    // "move it out of my way" trash action.
    const action = folder === 'Trash' ? deleteMessage({ folder, uid: mail.uid }) : moveMessage({ folder, uid: mail.uid, to: 'Trash' })
    dispatch(action).then(() => {
      toast.success(folder === 'Trash' ? 'Deleted' : 'Moved to Trash')
      handleGoBack()
    })
  }

  const handleMarkUnread = () => {
    dispatch(setMessageRead({ folder, uid: mail.uid, read: false })).then(handleGoBack)
  }

  return (
    <div
      className={classnames('email-app-details', {
        show: openMail
      })}
    >
      {loading ? (
        <div className='d-flex justify-content-center align-items-center h-100'>
          <Spinner color='primary' />
        </div>
      ) : mail !== null && mail !== undefined ? (
        <Fragment>
          <div className='email-detail-header'>
            <div className='email-header-left d-flex align-items-center'>
              <span className='go-back me-1' onClick={handleGoBack}>
                <ChevronLeft size={20} />
              </span>
              <h4 className='email-subject mb-0'>{mail.subject}</h4>
            </div>
            <div className='email-header-right ms-2 ps-1'>
              <ul className='list-inline m-0'>
                <li className='list-inline-item me-1'>
                  <UncontrolledDropdown>
                    <DropdownToggle tag='span'>
                      <Folder size={18} />
                    </DropdownToggle>
                    <DropdownMenu end>
                      {MOVE_TARGETS.filter(t => t.key !== folder).map(t => (
                        <DropdownItem
                          key={t.key}
                          tag='a'
                          href='/'
                          onClick={e => {
                            e.preventDefault()
                            handleMove(t.key)
                          }}
                        >
                          {t.label}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </UncontrolledDropdown>
                </li>
                <li className='list-inline-item me-1'>
                  <span className='action-icon' onClick={handleMarkUnread} title='Mark as unread'>
                    <Mail size={18} />
                  </span>
                </li>
                <li className='list-inline-item me-1'>
                  <span className='action-icon' onClick={handleDelete} title={folder === 'Trash' ? 'Delete permanently' : 'Move to Trash'}>
                    <Trash2 size={18} />
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <PerfectScrollbar className='email-scroll-area' options={{ wheelPropagation: false }}>
            <Card className='mb-2 mt-2'>
              <CardHeader className='email-detail-head'>
                <div className='user-details d-flex justify-content-between align-items-center flex-wrap'>
                  <Avatar
                    initials
                    color='light-primary'
                    className='me-75'
                    imgHeight='48'
                    imgWidth='48'
                    content={mail.from?.name || mail.from?.email || '?'}
                  />
                  <div className='mail-items'>
                    <h5 className='mb-0'>{mail.from?.name || mail.from?.email}</h5>
                    <span className='font-small-3 text-muted'>{mail.from?.email}</span>
                  </div>
                </div>
                <div className='mail-meta-item d-flex align-items-center'>
                  <small className='mail-date-time text-muted'>{mail.date ? formatDate(mail.date) : ''}</small>
                </div>
              </CardHeader>
              <CardBody className='mail-message-wrapper pt-2'>
                {mail.bodyHtml ? (
                  <div className='mail-message'>
                    <EmailBodyFrame html={mail.bodyHtml} />
                  </div>
                ) : (
                  <div className='mail-message'>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{mail.bodyPlain}</pre>
                  </div>
                )}
              </CardBody>
              {mail.attachments && mail.attachments.length ? (
                <CardFooter>
                  <div className='mail-attachments'>
                    <div className='d-flex align-items-center mb-1'>
                      <Paperclip size={16} />
                      <h5 className='fw-bolder text-body mb-0 ms-50'>{mail.attachments.length} Attachment</h5>
                    </div>
                    <div className='d-flex flex-column'>
                      {mail.attachments.map(a => (
                        <span key={a.fileName} className='text-muted'>
                          {a.fileName} <small>({Math.round(a.size / 1024)} KB)</small>
                        </span>
                      ))}
                    </div>
                  </div>
                </CardFooter>
              ) : null}
            </Card>
            <Card>
              <CardBody className='d-flex' style={{ gap: '1rem' }}>
                <span className='fw-bold cursor-pointer' onClick={handleReply}>
                  <CornerUpLeft size={14} className='me-50' />
                  Reply
                </span>
                <span className='fw-bold cursor-pointer' onClick={handleReply}>
                  <CornerUpRight size={14} className='me-50' />
                  Forward
                </span>
              </CardBody>
            </Card>
          </PerfectScrollbar>
        </Fragment>
      ) : null}
    </div>
  )
}

export default MailDetails
