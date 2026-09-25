import { Fragment, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatDate, formatRecipients, initialsSource, correspondentAvatarUrl } from '@utils'
import Avatar from '@components/avatar'
import EmailBodyFrame from './EmailBodyFrame'
import classnames from 'classnames'
import { Paperclip, ChevronLeft, CornerUpLeft, CornerUpRight, Star, Download, XCircle, Clock } from 'react-feather'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Card, CardBody, CardFooter, CardHeader, Spinner } from 'reactstrap'
import { toggleFlag, updateMessageFlag, deleteMessage, removeMessageFromList } from './store'

const MailDetails = props => {
  const { mail, loading, folder, openMail, dispatch, setOpenMail, toggleCompose, setReplyTo, viewingMailboxId } = props

  const [downloadingIndex, setDownloadingIndex] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const isScheduled = folder === 'Scheduled'
  const isSent = folder === 'Sent' || isScheduled
  const recipients = isSent ? formatRecipients(mail?.to) : ''
  const correspondentName = isSent ? recipients || 'No recipients' : mail?.from?.name || mail?.from?.email || '?'
  const avatarUrl = correspondentAvatarUrl(mail, isSent)

  const handleGoBack = () => setOpenMail(false)

  const handleReply = mode => {
    setReplyTo({ ...mail, mode })
    toggleCompose()
  }

  const handleToggleFlag = () => {
    const flagged = !mail.isFlagged
    dispatch(updateMessageFlag({ uid: mail.uid, flagged }))
    dispatch(toggleFlag({ folder, uid: mail.uid, flagged }))
  }

  const handleCancelSend = () => {
    setCancelling(true)
    dispatch(deleteMessage({ folder, uid: mail.uid }))
      .unwrap()
      .then(() => {
        dispatch(removeMessageFromList(mail.uid))
        toast.success('Scheduled send cancelled')
        setOpenMail(false)
      })
      .catch(err => {
        setCancelling(false)
        toast.error(err?.message || 'Failed to cancel')
      })
  }

  const handleDownloadAttachment = async (index, fileName) => {
    setDownloadingIndex(index)
    try {
      const endpoint = viewingMailboxId
        ? `/admin-mailbox/${viewingMailboxId}/${folder}/messages/${mail.uid}/attachments/${index}`
        : `/mailbox/${folder}/messages/${mail.uid}/attachments/${index}`
      const response = await axios.get(endpoint, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Failed to download attachment')
    } finally {
      setDownloadingIndex(null)
    }
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
            {
                                               }
            {!isScheduled && !viewingMailboxId && (
              <div className='email-header-right ms-2 ps-1'>
                <ul className='list-inline m-0'>
                  <li className='list-inline-item me-1'>
                    <span className='action-icon' onClick={handleToggleFlag} title={mail.isFlagged ? 'Unflag' : 'Flag'}>
                      <Star size={18} className={mail.isFlagged ? 'text-warning' : ''} fill={mail.isFlagged ? 'currentColor' : 'none'} />
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>
          {isScheduled && (
            <div className='alert alert-primary d-flex align-items-center mx-2 mt-1 mb-0 py-50 px-1'>
              <Clock size={14} className='me-50 flex-shrink-0' />
              <span>
                Scheduled to send{' '}
                {mail.date
                  ? formatDate(mail.date, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })
                  : ''}
              </span>
            </div>
          )}
          <PerfectScrollbar className='email-scroll-area' options={{ wheelPropagation: false }}>
            <Card className='mb-2 mt-2'>
              <CardHeader className='email-detail-head'>
                <div className='user-details d-flex justify-content-between align-items-center flex-wrap'>
                  <Avatar
                    img={avatarUrl || undefined}
                    initials={!avatarUrl}
                    color='light-primary'
                    className='me-75'
                    imgHeight='48'
                    imgWidth='48'
                    content={initialsSource(correspondentName)}
                  />
                  <div className='mail-items'>
                    <h5 className='mb-0'>{correspondentName}</h5>
                    <span className='font-small-3 text-muted'>{isSent ? 'To' : mail.from?.email}</span>
                  </div>
                </div>
                <div className='mail-meta-item d-flex align-items-center'>
                  <small className='mail-date-time text-muted'>
                    {mail.date ? formatDate(mail.date, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' }) : ''}
                  </small>
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
                    <div className='d-flex flex-column' style={{ gap: '0.4rem' }}>
                      {mail.attachments.map((a, index) => (
                        <div
                          key={`${a.fileName}-${index}`}
                          className='d-flex align-items-center justify-content-between border rounded p-50'
                          style={{ maxWidth: '360px' }}
                        >
                          <span className='text-truncate' title={a.fileName}>
                            {a.fileName} <small className='text-muted'>({Math.round(a.size / 1024)} KB)</small>
                          </span>
                          <span
                            className='cursor-pointer flex-shrink-0 ms-1'
                            onClick={() => handleDownloadAttachment(index, a.fileName)}
                            title='Download'
                          >
                            {downloadingIndex === index ? <Spinner size='sm' /> : <Download size={16} />}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardFooter>
              ) : null}
            </Card>
            {
                                                                       }
            <Card>
              <CardBody className='d-flex' style={{ gap: '1rem' }}>
                {isScheduled ? (
                  <span
                    className={classnames('fw-bold text-danger', { 'cursor-pointer': !cancelling })}
                    onClick={cancelling ? undefined : handleCancelSend}
                  >
                    <XCircle size={14} className='me-50' />
                    {cancelling ? 'Cancelling...' : 'Cancel Send'}
                  </span>
                ) : (
                  <>
                    <span className='fw-bold cursor-pointer' onClick={() => handleReply('reply')}>
                      <CornerUpLeft size={14} className='me-50' />
                      Reply
                    </span>
                    <span className='fw-bold cursor-pointer' onClick={() => handleReply('forward')}>
                      <CornerUpRight size={14} className='me-50' />
                      Forward
                    </span>
                  </>
                )}
              </CardBody>
            </Card>
          </PerfectScrollbar>
        </Fragment>
      ) : null}
    </div>
  )
}

export default MailDetails