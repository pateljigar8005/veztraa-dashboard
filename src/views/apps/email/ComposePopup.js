// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import toast from 'react-hot-toast'
import { Editor, sanitizeHtml } from '@veztraa/editor'
import { useDispatch } from 'react-redux'
import { X, Paperclip } from 'react-feather'

// ** Reactstrap Imports
import { Form, Label, Input, Modal, Button, ModalBody, ModalFooter } from 'reactstrap'

// ** Store & Actions
import { sendMessage } from './store'

// ** Custom Components
import EmailRecipientsInput from './EmailRecipientsInput'

// ** Shared
import { getFileTypeIcon } from '../shared/getFileTypeIcon'

const blank = { to: '', cc: '', bcc: '', subject: '', body: '' }

const ComposePopup = ({ composeOpen, toggleCompose, replyTo }) => {
  const dispatch = useDispatch()

  // ** States
  const [ccOpen, setCCOpen] = useState(false)
  const [bccOpen, setBCCOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [fields, setFields] = useState(blank)
  const [attachments, setAttachments] = useState([])

  // ** Pre-fill when opened as a Reply/Forward (see MailDetails)
  useEffect(() => {
    if (composeOpen && replyTo) {
      // The quoted email's own raw HTML can carry <style>/<script> tags
      // (common in marketing/template emails) - the editor drops the
      // original message straight into its live editable DOM, so an
      // un-sanitized <style> here would leak out and affect the whole page,
      // exactly like the bug fixed in MailDetails' body rendering.
      const quotedBody = replyTo.bodyHtml
        ? sanitizeHtml(replyTo.bodyHtml)
        : (replyTo.bodyPlain || '').replace(/\n/g, '<br>')

      setFields({
        to: replyTo.from?.email || '',
        cc: '',
        bcc: '',
        subject: replyTo.subject?.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`,
        body: `<br><br><blockquote>${quotedBody}</blockquote>`
      })
    } else if (composeOpen) {
      setFields(blank)
    }
    setAttachments([])
  }, [composeOpen, replyTo])

  const setField = (key, value) => setFields(prev => ({ ...prev, [key]: value }))

  const handleAttachFiles = e => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
    e.target.value = '' // allow re-selecting the same file after removing it
  }

  const removeAttachment = index => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = bytes => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleClose = e => {
    e?.preventDefault()
    toggleCompose()
  }

  const handleSend = e => {
    e.preventDefault()
    if (!fields.to.trim() || !fields.subject.trim()) {
      toast.error('To and Subject are required')
      return
    }

    setSending(true)
    dispatch(
      sendMessage({
        to: fields.to,
        cc: fields.cc,
        bcc: fields.bcc,
        subject: fields.subject,
        body: fields.body,
        in_reply_to: replyTo?.messageId || null,
        attachments
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Message sent')
        setSending(false)
        toggleCompose()
      })
      .catch(err => {
        setSending(false)
        toast.error(err?.message || 'Failed to send')
      })
  }

  return (
    <Modal
      id='compose-mail'
      isOpen={composeOpen}
      centered
      size='xl'
      container='.content-body'
      toggle={toggleCompose}
    >
      <div className='modal-header d-flex align-items-center justify-content-between mb-1'>
        <h5 className='modal-title'>Compose Mail</h5>
        <X className='fw-normal cursor-pointer' size={16} onClick={handleClose} />
      </div>
      <Form className='compose-form' onSubmit={handleSend}>
        <ModalBody style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div className='compose-mail-form-field'>
            <Label for='email-to' className='form-label me-1 mb-0'>
              To:
            </Label>
            <EmailRecipientsInput
              id='email-to'
              placeholder='recipient@example.com, another@example.com'
              value={fields.to}
              onChange={val => setField('to', val)}
            />
            <div>
              <a href='/' className='toggle-cc text-body me-1' onClick={e => { e.preventDefault(); setCCOpen(!ccOpen) }}>
                Cc
              </a>
              <a href='/' className='toggle-cc text-body' onClick={e => { e.preventDefault(); setBCCOpen(!bccOpen) }}>
                Bcc
              </a>
            </div>
          </div>
          {ccOpen && (
            <div className='compose-mail-form-field cc-wrapper'>
              <Label for='email-cc' className='form-label me-1 mb-0'>
                Cc:
              </Label>
              <EmailRecipientsInput id='email-cc' value={fields.cc} onChange={val => setField('cc', val)} />
              <div>
                <a href='/' className='toggle-cc text-body' onClick={e => { e.preventDefault(); setCCOpen(false) }}>
                  <X size={14} />
                </a>
              </div>
            </div>
          )}
          {bccOpen && (
            <div className='compose-mail-form-field cc-wrapper'>
              <Label for='email-bcc' className='form-label me-1 mb-0'>
                Bcc:
              </Label>
              <EmailRecipientsInput id='email-bcc' value={fields.bcc} onChange={val => setField('bcc', val)} />
              <div>
                <a href='/' className='toggle-cc text-body' onClick={e => { e.preventDefault(); setBCCOpen(false) }}>
                  <X size={14} />
                </a>
              </div>
            </div>
          )}
          <div className='compose-mail-form-field'>
            <Label for='email-subject' className='form-label me-1 mb-0'>
              Subject:
            </Label>
            <Input
              id='email-subject'
              placeholder='Subject'
              value={fields.subject}
              onChange={e => setField('subject', e.target.value)}
            />
          </div>
          <div id='message-editor'>
            <Editor value={fields.body} onChange={value => setField('body', value)} placeholder='Message' height={400} />
          </div>
          {attachments.length > 0 && (
            <div className='d-flex flex-wrap mt-1' style={{ gap: '0.5rem' }}>
              {attachments.map((file, index) => {
                const FileIcon = getFileTypeIcon(file.name)
                return (
                  <div
                    key={`${file.name}-${index}`}
                    className='d-flex align-items-center border rounded-pill ps-75 pe-50 py-25 bg-light-secondary'
                    style={{ maxWidth: '260px' }}
                  >
                    <FileIcon size={13} className='me-50 flex-shrink-0' />
                    <span className='text-truncate small'>{file.name}</span>
                    <small className='text-muted ms-50 flex-shrink-0'>{formatFileSize(file.size)}</small>
                    <X
                      size={13}
                      className='cursor-pointer ms-50 flex-shrink-0'
                      onClick={() => removeAttachment(index)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <div className='btn-wrapper d-flex align-items-center'>
            <Button type='submit' color='primary' className='me-1' disabled={sending}>
              {sending ? 'Sending...' : 'Send'}
            </Button>
            <Label for='email-attachment' className='attachment-icon mb-0 cursor-pointer'>
              <Paperclip size={18} />
            </Label>
            <Input id='email-attachment' type='file' multiple hidden onChange={handleAttachFiles} />
          </div>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default ComposePopup
