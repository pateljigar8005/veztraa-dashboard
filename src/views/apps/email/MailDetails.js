// ** React Imports
import { Fragment, useState } from 'react'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'

// ** Utils
import { formatDate, formatRecipients } from '@utils'

// ** Custom Components
import Avatar from '@components/avatar'
import EmailBodyFrame from './EmailBodyFrame'

import classnames from 'classnames'
import { Paperclip, ChevronLeft, CornerUpLeft, CornerUpRight, Star, Download } from 'react-feather'
import PerfectScrollbar from 'react-perfect-scrollbar'

// ** Reactstrap Imports
import { Card, CardBody, CardFooter, CardHeader, Spinner } from 'reactstrap'

// ** Store & Actions
import { toggleFlag, updateMessageFlag } from './store'

const MailDetails = props => {
  // ** Props
  const { mail, loading, folder, openMail, dispatch, setOpenMail, toggleCompose, setReplyTo } = props

  const [downloadingIndex, setDownloadingIndex] = useState(null)

  // In Sent, "From" is always yourself - who this went TO is the useful
  // correspondent to show instead, same reasoning as MailCard.js's own list.
  const isSent = folder === 'Sent'
  const recipients = isSent ? formatRecipients(mail?.to) : ''
  const correspondentName = isSent ? recipients || 'No recipients' : mail?.from?.name || mail?.from?.email || '?'

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

  // Attachments are never cached (same as the body - see
  // MailboxController::downloadAttachment()), so this always hits IMAP live
  // - a blob response + synthetic <a> click, same pattern as Kanban's own
  // task attachment download, since a plain <a href> wouldn't carry the
  // JWT this endpoint needs.
  const handleDownloadAttachment = async (index, fileName) => {
    setDownloadingIndex(index)
    try {
      const response = await axios.get(`/mailbox/${folder}/messages/${mail.uid}/attachments/${index}`, {
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
            <div className='email-header-right ms-2 ps-1'>
              <ul className='list-inline m-0'>
                <li className='list-inline-item me-1'>
                  <span className='action-icon' onClick={handleToggleFlag} title={mail.isFlagged ? 'Unflag' : 'Flag'}>
                    <Star size={18} className={mail.isFlagged ? 'text-warning' : ''} fill={mail.isFlagged ? 'currentColor' : 'none'} />
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <PerfectScrollbar className='email-scroll-area' options={{ wheelPropagation: false }}>
            <Card className='mb-2 mt-2'>
              <CardHeader className='email-detail-head'>
                <div className='user-details d-flex justify-content-between align-items-center flex-wrap'>
                  <Avatar initials color='light-primary' className='me-75' imgHeight='48' imgWidth='48' content={correspondentName} />
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
            <Card>
              <CardBody className='d-flex' style={{ gap: '1rem' }}>
                <span className='fw-bold cursor-pointer' onClick={() => handleReply('reply')}>
                  <CornerUpLeft size={14} className='me-50' />
                  Reply
                </span>
                <span className='fw-bold cursor-pointer' onClick={() => handleReply('forward')}>
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
