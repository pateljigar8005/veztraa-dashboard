// ** React Imports
import { useEffect, useRef, useState } from 'react'

// ** Third Party Components
import axios from 'axios'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import withReactContent from 'sweetalert2-react-content'
import { Editor, sanitizeHtml } from '@veztraa/editor'
import { useDispatch } from 'react-redux'
import { X, Paperclip } from 'react-feather'

const MySwal = withReactContent(Swal)

// ** Reactstrap Imports
import { Form, Label, Input, Modal, Button, ModalBody, ModalFooter } from 'reactstrap'

// ** Store & Actions
import { sendMessage, saveDraft, removeMessageFromList } from './store'

// ** Custom Components
import EmailRecipientsInput from './EmailRecipientsInput'

// ** Shared
import { getFileTypeIcon } from '../shared/getFileTypeIcon'

// ** Utils
import { getUserData, uploadEditorImage } from '@utils'

const blank = { to: '', cc: '', bcc: '', subject: '', body: '' }

const ComposePopup = ({ composeOpen, toggleCompose, replyTo }) => {
  const dispatch = useDispatch()

  // ** States
  const [ccOpen, setCCOpen] = useState(false)
  const [bccOpen, setBCCOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [fields, setFields] = useState(blank)
  // A snapshot of what the fields were populated with when this session
  // opened (blank, a reply/forward's quoted content, or an existing draft's
  // own content) - the close-confirmation compares against this rather than
  // just checking "is anything filled in", so reopening an untouched draft
  // and closing it again doesn't prompt to save a no-op re-save of itself.
  const [initialFields, setInitialFields] = useState(blank)
  const [attachments, setAttachments] = useState([])
  const [contactOptions, setContactOptions] = useState([])
  // The currently-open draft's own uid, if this session started from
  // editing one (see the pre-fill effect below) or has been saved at least
  // once since - each save replaces the previous copy and returns a NEW uid
  // (IMAP has no in-place message edit), so this must track that going
  // forward rather than staying pinned to whatever it opened with.
  const [draftUid, setDraftUid] = useState(null)
  // The logged-in user's own configured signature + whether Compose should
  // auto-append it (both set from the User module's own Email Settings -
  // there's no per-email override here, it's a persisted account setting) -
  // fetched once and reused for every compose session rather than re-fetched
  // per open, since neither can change mid-session.
  const [signature, setSignature] = useState('')
  const [autoAppendSignature, setAutoAppendSignature] = useState(false)
  // Guards the injection effect below (see its own comment) to run at most
  // once per compose session.
  const signatureInjectedRef = useRef(false)

  // Suggestions for To/Cc/Bcc - pulled from existing users + clients (the
  // people most likely to be emailed) rather than a dedicated endpoint, the
  // same lightweight list endpoints already used for assignee pickers
  // elsewhere (see kanban/TaskSidebar.js). Free-text entry still works for
  // anyone not in either list.
  useEffect(() => {
    if (!composeOpen || contactOptions.length) return
    const ownEmail = getUserData()?.email?.toLowerCase()
    Promise.all([
      axios.get('/users', { params: { perPage: 200 } }).catch(() => null),
      axios.get('/clients', { params: { perPage: 200 } }).catch(() => null)
    ]).then(([usersRes, clientsRes]) => {
      const users = (usersRes?.data?.data?.users || [])
        // You're never a recipient of your own email - suggesting yourself
        // here would be a confusing, wrong-looking option to pick.
        .filter(u => u.is_active && u.email && u.email.toLowerCase() !== ownEmail)
        .map(u => ({ value: u.email, label: `${u.fullName} <${u.email}>` }))
      const clients = (clientsRes?.data?.data?.clients || [])
        .filter(c => c.is_active && c.email)
        .map(c => ({ value: c.email, label: `${c.company_name || c.fullName} <${c.email}>` }))
      setContactOptions([...users, ...clients])
    })
  }, [composeOpen])

  // Own signature + auto-append setting - both come straight from the User
  // module's Email Settings (see UserForm's own email_signature_auto_append
  // switch), there's no in-Compose control. Re-fetched on every open rather
  // than cached after the first (contrast the contact suggestions above,
  // which genuinely can't change mid-session) - the user can navigate to
  // their own profile, flip the switch, and come straight back to Email
  // without a full page reload, and a stale cached "on" would keep
  // appending a signature they just turned off.
  useEffect(() => {
    if (!composeOpen) return
    const userId = getUserData()?.id
    if (!userId) return
    axios
      .get(`/users/${userId}`)
      .then(response => {
        setSignature(response.data.data.email_signature || '')
        setAutoAppendSignature(Boolean(response.data.data.email_signature_auto_append))
      })
      .catch(() => {})
  }, [composeOpen])

  // ** Pre-fill when opened as a Reply/Forward/Draft-edit (see MailDetails
  // and Mails.js's Drafts-folder click handling)
  useEffect(() => {
    if (composeOpen && replyTo?.loading) {
      // The popup opens immediately on click (see Mails.js) rather than
      // waiting on the live IMAP fetch to finish first - nothing to fill in
      // yet. Left blank/disabled (see the render below) until it resolves,
      // rather than risking prefill silently overwriting anything the user
      // managed to type in the meantime.
      setFields(blank)
      setInitialFields(blank)
      setDraftUid(null)
      setAttachments([])
      return
    }
    if (composeOpen && replyTo?.mode === 'draft') {
      // Editing an existing draft - fields go in exactly as saved, no Re:/
      // Fwd: prefix or quoting. Bcc can't be restored (PHPMailer never
      // writes a Bcc header into the message it builds, by design - see
      // Mailer::buildDraft()), so a draft's Bcc is only ever remembered for
      // as long as this compose session stays open.
      const draftFields = {
        to: (replyTo.to || []).map(a => a.email).join(','),
        cc: (replyTo.cc || []).map(a => a.email).join(','),
        bcc: '',
        subject: replyTo.subject === '(no subject)' ? '' : replyTo.subject || '',
        body: replyTo.bodyHtml ? sanitizeHtml(replyTo.bodyHtml) : (replyTo.bodyPlain || '').replace(/\n/g, '<br>')
      }
      setFields(draftFields)
      setInitialFields(draftFields)
      setDraftUid(replyTo.uid)
    } else if (composeOpen && replyTo) {
      // The quoted email's own raw HTML can carry <style>/<script> tags
      // (common in marketing/template emails) - the editor drops the
      // original message straight into its live editable DOM, so an
      // un-sanitized <style> here would leak out and affect the whole page,
      // exactly like the bug fixed in MailDetails' body rendering.
      const quotedBody = replyTo.bodyHtml
        ? sanitizeHtml(replyTo.bodyHtml)
        : (replyTo.bodyPlain || '').replace(/\n/g, '<br>')

      const isForward = replyTo.mode === 'forward'
      const prefix = isForward ? 'Fwd:' : 'Re:'
      const subject = replyTo.subject?.startsWith(prefix) ? replyTo.subject : `${prefix} ${replyTo.subject}`

      const replyFields = {
        // Forwarding has no natural recipient (you're sending it to someone
        // new, not back to the sender) - only Reply pre-fills To.
        to: isForward ? '' : replyTo.from?.email || '',
        cc: '',
        bcc: '',
        subject,
        body: `<br><br><blockquote>${quotedBody}</blockquote>`
      }
      setFields(replyFields)
      setInitialFields(replyFields)
      setDraftUid(null)
    } else if (composeOpen) {
      setFields(blank)
      setInitialFields(blank)
      setDraftUid(null)
    }
    setAttachments([])
  }, [composeOpen, replyTo])

  // Actually injects the signature into the visible body (not just appended
  // silently at send time - the whole point is seeing it, same as any other
  // mail client) exactly once per compose session. Split out from the
  // pre-fill effect above because the signature/autoAppendSignature fetch is
  // async and Compose opens immediately without waiting on it (see that
  // fetch effect) - on the very first compose of a browser session this
  // fires once that fetch resolves; on every session after, signature is
  // already cached, so it fires immediately on open instead. A functional
  // update, so it only ever appends to whatever's already in the editor
  // (blank, or a reply/forward's quoted content) rather than overwriting -
  // if the fetch happens to resolve after the user's already started
  // typing, their text is still there, the signature is just added below it.
  useEffect(() => {
    if (!composeOpen) {
      // Also clears the fetched signature/setting itself, not just the
      // ref - otherwise the very next open's injection effect would run
      // once synchronously with these STALE values (from whatever they
      // were last fetched as) before the fresh re-fetch above has actually
      // resolved, and could inject (or skip) based on a setting the user
      // has since changed on their own profile in the meantime.
      signatureInjectedRef.current = false
      setSignature('')
      setAutoAppendSignature(false)
      return
    }
    if (signatureInjectedRef.current || replyTo?.loading || replyTo?.mode === 'draft') return
    if (!signature || !autoAppendSignature) return

    signatureInjectedRef.current = true
    const withSignature = body => `${body}<br><br>${signature}`
    setFields(prev => ({ ...prev, body: withSignature(prev.body) }))
    setInitialFields(prev => ({ ...prev, body: withSignature(prev.body) }))
  }, [composeOpen, replyTo, signature, autoAppendSignature])

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

  // Compares against the snapshot taken when this session opened (see the
  // pre-fill effect above), not just "is anything filled in" - otherwise
  // reopening an existing draft/reply untouched and closing it again would
  // prompt to save, even though nothing actually changed.
  const hasUnsavedContent = () =>
    attachments.length > 0 ||
    fields.to !== initialFields.to ||
    fields.cc !== initialFields.cc ||
    fields.bcc !== initialFields.bcc ||
    fields.subject !== initialFields.subject ||
    fields.body !== initialFields.body

  const handleClose = e => {
    e?.preventDefault()
    if (replyTo?.loading || !hasUnsavedContent()) {
      toggleCompose()
      return
    }

    MySwal.fire({
      title: 'Save this as a draft?',
      text: "You'll lose these changes if you discard instead.",
      icon: 'warning',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Save Draft',
      denyButtonText: 'Discard',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary',
        denyButton: 'btn btn-danger ms-1',
        cancelButton: 'btn btn-outline-secondary ms-1'
      },
      buttonsStyling: false
    }).then(result => {
      if (result.isConfirmed) {
        handleSaveDraft()
      } else if (result.isDenied) {
        toggleCompose()
      }
      // Cancel (or dismissed) - stay open, nothing to do.
    })
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
        // Sending from an open draft - the backend deletes it from Drafts
        // once the send actually succeeds (see MailboxOutbox::processOne()),
        // so it doesn't linger there after being sent.
        draft_uid: draftUid,
        attachments
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Sending...')
        setSending(false)
        // The backend only deletes the source draft once the send actually
        // finishes in the background (a few seconds later - see
        // MailboxOutbox::processOne()), but there's no reason to make the
        // Drafts list wait that long to stop showing something that's
        // already on its way out.
        if (draftUid) dispatch(removeMessageFromList(draftUid))
        toggleCompose()
      })
      .catch(err => {
        setSending(false)
        toast.error(err?.message || 'Failed to send')
      })
  }

  const handleSaveDraft = () => {
    if (!fields.to.trim() && !fields.subject.trim() && !fields.body.trim()) {
      toast.error('Nothing to save yet')
      return
    }

    setSavingDraft(true)
    dispatch(
      saveDraft({
        to: fields.to,
        cc: fields.cc,
        bcc: fields.bcc,
        subject: fields.subject,
        body: fields.body,
        uid: draftUid,
        attachments
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Draft saved')
        setSavingDraft(false)
        toggleCompose()
      })
      .catch(err => {
        setSavingDraft(false)
        toast.error(err?.message || 'Failed to save draft')
      })
  }

  return (
    <Modal
      id='compose-mail'
      isOpen={composeOpen}
      centered
      size='xl'
      container='.content-body'
      toggle={handleClose}
    >
      <div className='modal-header d-flex align-items-center justify-content-between'>
        <h5 className='modal-title'>Compose Mail</h5>
        <X className='fw-normal cursor-pointer' size={16} onClick={handleClose} />
      </div>
      <Form className='compose-form' onSubmit={handleSend}>
        <ModalBody style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {replyTo?.loading ? (
            <div className='placeholder-glow' aria-hidden='true'>
              <div className='compose-mail-form-field'>
                <span className='placeholder rounded' style={{ width: '30px', height: '18px' }} />
                <span className='placeholder rounded flex-grow-1 ms-2' style={{ height: '34px' }} />
              </div>
              <div className='compose-mail-form-field'>
                <span className='placeholder rounded' style={{ width: '60px', height: '18px' }} />
                <span className='placeholder rounded flex-grow-1 ms-2' style={{ height: '34px' }} />
              </div>
              <div className='mt-1'>
                <span className='placeholder rounded d-block w-100' style={{ height: '400px' }} />
              </div>
            </div>
          ) : (
          <>
          <div className='compose-mail-form-field'>
            <Label for='email-to' className='form-label me-1 mb-0'>
              To:
            </Label>
            <EmailRecipientsInput
              id='email-to'
              placeholder='recipient@example.com, another@example.com'
              value={fields.to}
              onChange={val => setField('to', val)}
              options={contactOptions}
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
              <EmailRecipientsInput id='email-cc' value={fields.cc} onChange={val => setField('cc', val)} options={contactOptions} />
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
              <EmailRecipientsInput id='email-bcc' value={fields.bcc} onChange={val => setField('bcc', val)} options={contactOptions} />
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
          <div id='message-editor' style={{ marginTop: '8px' }}>
            <Editor
              value={fields.body}
              onChange={value => setField('body', value)}
              placeholder='Message'
              height={400}
              onImageUpload={uploadEditorImage}
            />
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
          </>
          )}
        </ModalBody>
        <ModalFooter>
          <div className='btn-wrapper d-flex align-items-center'>
            <Button
              type='button'
              color='secondary'
              outline
              className='me-1'
              disabled={savingDraft || replyTo?.loading}
              onClick={handleSaveDraft}
            >
              {savingDraft ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button type='submit' color='primary' className='me-1' disabled={sending || replyTo?.loading}>
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
