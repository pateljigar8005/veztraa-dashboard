import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import Select from 'react-select'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import withReactContent from 'sweetalert2-react-content'
import Flatpickr from 'react-flatpickr'
import { Editor, sanitizeHtml } from '@veztraa/editor'
import { useDispatch } from 'react-redux'
import { X, Paperclip, Clock, ChevronDown } from 'react-feather'
const MySwal = withReactContent(Swal)
import { Form, Label, Input, Modal, Button, ButtonGroup, Dropdown, DropdownToggle, DropdownMenu, ModalBody, ModalFooter } from 'reactstrap'
import '@styles/react/libs/flatpickr/flatpickr.scss'
import { sendMessage, saveDraft, removeMessageFromList } from './store'
import EmailRecipientsInput from './EmailRecipientsInput'
import { getFileTypeIcon } from '../shared/getFileTypeIcon'
import { getUserData, uploadEditorImage, selectThemeColors } from '@utils'

const blank = { to: '', cc: '', bcc: '', subject: '', body: '' }

const ComposePopup = ({ composeOpen, toggleCompose, replyTo, adminMailboxId, adminMailboxEmail }) => {
  const dispatch = useDispatch()

  const [ccOpen, setCCOpen] = useState(false)
  const [bccOpen, setBCCOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(null)
  const [fields, setFields] = useState(blank)
  const [initialFields, setInitialFields] = useState(blank)
  const [attachments, setAttachments] = useState([])
  const [contactOptions, setContactOptions] = useState([])
  const [templateOptions, setTemplateOptions] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [draftUid, setDraftUid] = useState(null)
  const [signature, setSignature] = useState('')
  const [autoAppendSignature, setAutoAppendSignature] = useState(false)
  const signatureInjectedRef = useRef(false)

  useEffect(() => {
    if (!composeOpen || contactOptions.length) return
    const ownEmail = getUserData()?.email?.toLowerCase()
    Promise.all([
      axios.get('/users', { params: { perPage: 200 } }).catch(() => null),
      axios.get('/clients', { params: { perPage: 200 } }).catch(() => null),
      axios.get('/mailbox/contacts').catch(() => null)
    ]).then(([usersRes, clientsRes, contactsRes]) => {
      const seen = new Set()
      const options = []
      const addOption = (email, label) => {
        const key = (email || '').toLowerCase()
        if (!key || key === ownEmail || seen.has(key)) return
        seen.add(key)
        options.push({ value: email, label })
      }

      ;(usersRes?.data?.data?.users || [])
        .filter(u => u.is_active && u.email)
        .forEach(u => addOption(u.email, `${u.fullName} <${u.email}>`))

      ;(clientsRes?.data?.data?.clients || [])
        .filter(c => c.is_active && c.email)
        .forEach(c => addOption(c.email, `${c.company_name || c.fullName} <${c.email}>`))

      ;(contactsRes?.data?.data?.contacts || [])
        .forEach(c => addOption(c.email, c.name ? `${c.name} <${c.email}>` : c.email))

      setContactOptions(options)
    })
  }, [composeOpen])

  useEffect(() => {
    if (!composeOpen || templateOptions.length) return
    const currentUser = getUserData()
    const isAdmin = (currentUser?.role || '').toLowerCase() === 'admin'
    axios
      .get('/email-templates', { params: { perPage: 100 } })
      .then(response => {
        const templates = response.data?.data?.emailTemplates || []
        setTemplateOptions(
          templates
            .filter(
              t =>
                t.is_active &&
                (isAdmin || !t.visible_role_ids?.length || t.visible_role_ids.includes(currentUser?.role_id))
            )
            .map(t => ({ value: t.id, label: t.name, subject: t.subject, content: t.content }))
        )
      })
      .catch(() => { })
  }, [composeOpen])

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
      .catch(() => { })
  }, [composeOpen])

  useEffect(() => {
    if (composeOpen && replyTo?.loading) {
      setFields(blank)
      setInitialFields(blank)
      setDraftUid(null)
      setAttachments([])
      setSelectedTemplate(null)
      return
    }
    if (composeOpen && replyTo?.mode === 'draft') {
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
      const quotedBody = replyTo.bodyHtml
        ? sanitizeHtml(replyTo.bodyHtml)
        : (replyTo.bodyPlain || '').replace(/\n/g, '<br>')

      const isForward = replyTo.mode === 'forward'
      const prefix = isForward ? 'Fwd:' : 'Re:'
      const subject = replyTo.subject?.startsWith(prefix) ? replyTo.subject : `${prefix} ${replyTo.subject}`

      const replyFields = {
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
    setSelectedTemplate(null)
    setScheduleOpen(false)
    setScheduleDate(null)
  }, [composeOpen, replyTo])

  useEffect(() => {
    if (!composeOpen) {
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

  const handleTemplateSelect = option => {
    setSelectedTemplate(option || null)
    if (!option) return
    setFields(prev => ({ ...prev, subject: option.subject || prev.subject, body: option.content || '' }))
  }

  const handleAttachFiles = e => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
    e.target.value = ''
  }

  const removeAttachment = index => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = bytes => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

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

    if (adminMailboxId) {
      MySwal.fire({
        title: 'Discard this message?',
        text: "You'll lose these changes - drafts aren't supported for a company mailbox yet.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Discard',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn btn-danger',
          cancelButton: 'btn btn-outline-secondary ms-1'
        },
        buttonsStyling: false
      }).then(result => {
        if (result.isConfirmed) toggleCompose()
      })
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
    })
  }

  const scheduleAtPayload = date => (date ? date.toISOString() : null)

  const submitMessage = scheduledAt => {
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
        draft_uid: draftUid,
        scheduled_at: scheduledAt,
        company_mailbox_id: adminMailboxId || null,
        attachments
      })
    )
      .unwrap()
      .then(() => {
        toast.success(scheduledAt ? 'Scheduled' : 'Sending...')
        setSending(false)
        setScheduleOpen(false)
        if (draftUid) dispatch(removeMessageFromList(draftUid))
        toggleCompose()
      })
      .catch(err => {
        setSending(false)
        toast.error(err?.message || 'Failed to send')
      })
  }

  const handleSend = e => {
    e.preventDefault()
    submitMessage(null)
  }

  const handleScheduleSend = () => {
    if (!scheduleDate) {
      toast.error('Pick a date and time first')
      return
    }
    submitMessage(scheduleAtPayload(scheduleDate))
  }

  const handleSaveDraft = () => {
    if (adminMailboxId) {
      toast.error("Drafts aren't supported for a company mailbox yet")
      return
    }
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
              {
                                                                          }
              {adminMailboxId && (
                <div className='alert alert-primary d-flex align-items-center py-50 px-1 mb-1'>
                  <span>
                    Sending as <strong>{adminMailboxEmail || 'this mailbox'}</strong>
                  </span>
                </div>
              )}
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
        <ModalFooter className='d-flex align-items-center justify-content-between flex-nowrap'>
          <Select
            isClearable
            className='react-select me-1'
            classNamePrefix='select'
            theme={selectThemeColors}
            options={templateOptions}
            value={selectedTemplate}
            onChange={handleTemplateSelect}
            isDisabled={replyTo?.loading}
            placeholder='Load from template...'
            menuPlacement='top'
            styles={{ container: base => ({ ...base, width: '250px', maxWidth: '250px' }) }}
          />
          <div className='btn-wrapper d-flex align-items-center flex-shrink-0'>
            <Button
              type='button'
              color='secondary'
              outline
              className='me-1'
              disabled={savingDraft || replyTo?.loading || Boolean(adminMailboxId)}
              onClick={handleSaveDraft}
              title={adminMailboxId ? "Drafts aren't supported for a company mailbox yet" : undefined}
            >
              {savingDraft ? 'Saving...' : 'Save Draft'}
            </Button>
            <Dropdown
              isOpen={scheduleOpen}
              toggle={() => setScheduleOpen(!scheduleOpen)}
              className='me-1'
              direction='up'
            >
              <ButtonGroup>
                <Button type='submit' color='primary' disabled={sending || replyTo?.loading}>
                  {sending ? 'Sending...' : 'Send'}
                </Button>
                <DropdownToggle
                  caret
                  color='primary'
                  split
                  disabled={sending || replyTo?.loading}
                  title='Schedule send'
                >
                </DropdownToggle>
              </ButtonGroup>
              <DropdownMenu end className='p-1 schedule-send-menu' style={{ minWidth: '260px' }}>
                {
                                          }
                <style>{`
                  .schedule-send-menu .flatpickr-calendar.static {
                    top: auto;
                    bottom: calc(100% + 2px);
                  }
                `}</style>
                <p className='fw-bold mb-50 d-flex align-items-center'>
                  <Clock size={14} className='me-50' />
                  Schedule send
                </p>
                <Flatpickr
                  className='form-control mb-1'
                  value={scheduleDate}
                  onChange={([date]) => setScheduleDate(date)}
                  options={{
                    enableTime: true,
                    dateFormat: 'Y-m-d H:i',
                    minDate: new Date(),
                    time_24hr: false,
                    static: true
                  }}
                  placeholder='Pick a date and time...'
                />
                <Button color='primary' size='sm' block disabled={!scheduleDate || sending} onClick={handleScheduleSend}>
                  {sending ? 'Scheduling...' : 'Schedule'}
                </Button>
              </DropdownMenu>
            </Dropdown>
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