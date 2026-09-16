// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import toast from 'react-hot-toast'
import { Editor, sanitizeHtml } from '@veztraa/editor'
import { useDispatch } from 'react-redux'
import { Minus, X } from 'react-feather'

// ** Reactstrap Imports
import { Form, Label, Input, Modal, Button, ModalBody } from 'reactstrap'

// ** Store & Actions
import { sendMessage } from './store'

const blank = { to: '', cc: '', bcc: '', subject: '', body: '' }

const ComposePopup = ({ composeOpen, toggleCompose, replyTo }) => {
  const dispatch = useDispatch()

  // ** States
  const [ccOpen, setCCOpen] = useState(false)
  const [bccOpen, setBCCOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [fields, setFields] = useState(blank)

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
  }, [composeOpen, replyTo])

  const setField = (key, value) => setFields(prev => ({ ...prev, [key]: value }))

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
        in_reply_to: replyTo?.messageId || null
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
      scrollable
      fade={false}
      keyboard={false}
      backdrop={false}
      id='compose-mail'
      container='.content-body'
      className='modal-lg'
      isOpen={composeOpen}
      contentClassName='p-0'
      toggle={toggleCompose}
      modalClassName='modal-sticky'
    >
      <div className='modal-header'>
        <h5 className='modal-title'>Compose Mail</h5>
        <div className='modal-actions'>
          <a href='/' className='text-body me-75' onClick={handleClose}>
            <Minus size={14} />
          </a>
          <a href='/' className='text-body' onClick={handleClose}>
            <X size={14} />
          </a>
        </div>
      </div>
      <ModalBody className='flex-grow-1 p-0'>
        <Form className='compose-form' onSubmit={handleSend}>
          <div className='compose-mail-form-field'>
            <Label for='email-to' className='form-label'>
              To:
            </Label>
            <div className='flex-grow-1'>
              <Input
                id='email-to'
                className='border-0'
                placeholder='recipient@example.com, another@example.com'
                value={fields.to}
                onChange={e => setField('to', e.target.value)}
              />
            </div>
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
              <Label for='email-cc' className='form-label'>
                Cc:
              </Label>
              <div className='flex-grow-1'>
                <Input
                  id='email-cc'
                  className='border-0'
                  value={fields.cc}
                  onChange={e => setField('cc', e.target.value)}
                />
              </div>
              <div>
                <a href='/' className='toggle-cc text-body' onClick={e => { e.preventDefault(); setCCOpen(false) }}>
                  <X size={14} />
                </a>
              </div>
            </div>
          )}
          {bccOpen && (
            <div className='compose-mail-form-field cc-wrapper'>
              <Label for='email-bcc' className='form-label'>
                Bcc:
              </Label>
              <div className='flex-grow-1'>
                <Input
                  id='email-bcc'
                  className='border-0'
                  value={fields.bcc}
                  onChange={e => setField('bcc', e.target.value)}
                />
              </div>
              <div>
                <a href='/' className='toggle-cc text-body' onClick={e => { e.preventDefault(); setBCCOpen(false) }}>
                  <X size={14} />
                </a>
              </div>
            </div>
          )}
          <div className='compose-mail-form-field'>
            <Label for='email-subject' className='form-label'>
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
            <Editor value={fields.body} onChange={value => setField('body', value)} placeholder='Message' height={200} />
          </div>
          <div className='compose-footer-wrapper'>
            <div className='btn-wrapper d-flex align-items-center'>
              <Button type='submit' color='primary' disabled={sending}>
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </Form>
      </ModalBody>
    </Modal>
  )
}

export default ComposePopup
