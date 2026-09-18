// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { Plus, Edit2, Trash2, Mail } from 'react-feather'

// ** Reactstrap Imports
import {
  Button,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Label,
  Input,
  InputGroup,
  InputGroupText,
  FormText,
  Spinner
} from 'reactstrap'

// ** Custom Components
import InputPasswordToggle from '@components/input-password-toggle'

// ** Utils
import { confirmDelete } from '@src/utility/confirmDelete'

const defaultValues = { local_part: '', label: '', password: '' }

// ** Company Settings > Admin Emails - functional mailboxes not tied to any
// one User (sales@, no-reply@, inquiry@, ...), provisioned via the same
// cPanel connection configured on the Mailbox Provisioning tab (see
// CompanyMailboxController on the API side). A self-contained sub-component
// with its own fetch/save/delete rather than folded into the big
// react-hook-form the rest of this page shares - this is a list with its
// own add/edit/delete flow, not one more field on a single settings form.
const AdminEmailsTab = () => {
  const [mailDomain, setMailDomain] = useState('')
  const [mailboxes, setMailboxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const {
    control,
    reset,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({ defaultValues })

  const loadMailboxes = () => {
    axios.get('/company-mailboxes').then(response => {
      setMailboxes(response.data.data.companyMailboxes || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    axios.get('/company').then(response => setMailDomain(response.data.data.mail_domain || ''))
    loadMailboxes()
  }, [])

  const openAddModal = () => {
    setEditingId(null)
    reset(defaultValues)
    setModalOpen(true)
  }

  const openEditModal = mailbox => {
    setEditingId(mailbox.id)
    reset({ local_part: mailbox.local_part, label: mailbox.label || '', password: mailbox.password || '' })
    setModalOpen(true)
  }

  const onSubmit = data => {
    const localPart = data.local_part.trim()
    if (!localPart) {
      setError('local_part', { type: 'manual', message: 'Required' })
      return
    }
    if (!editingId && !data.password) {
      setError('password', { type: 'manual', message: 'Required to create this mailbox' })
      return
    }

    const payload = { local_part: localPart, label: data.label }
    if (data.password) payload.password = data.password

    setSaving(true)
    const request = editingId
      ? axios.put(`/company-mailboxes/${editingId}`, payload)
      : axios.post('/company-mailboxes', payload)

    request
      .then(() => {
        toast.success(editingId ? 'Mailbox updated' : 'Mailbox saved')
        setModalOpen(false)
        loadMailboxes()
      })
      .catch(err => {
        const apiErrors = err?.response?.data?.errors
        if (apiErrors) {
          Object.entries(apiErrors).forEach(([field, messages]) =>
            setError(field, { type: 'manual', message: messages[0] })
          )
        }
        toast.error(err?.response?.data?.message || 'Failed to save mailbox')
      })
      .finally(() => setSaving(false))
  }

  const handleDelete = mailbox => {
    confirmDelete({
      title: `Remove ${mailbox.email}?`,
      text: 'This only removes it from this list - it does not touch the real mailbox on the mail server.',
      onConfirm: () => {
        axios
          .delete(`/company-mailboxes/${mailbox.id}`)
          .then(() => {
            toast.success('Mailbox removed')
            loadMailboxes()
          })
          .catch(err => toast.error(err?.response?.data?.message || 'Failed to remove mailbox'))
      }
    })
  }

  if (loading) return null

  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-1'>
        <div>
          <h6 className='mb-0'>Admin Emails</h6>
          <p className='text-muted small mb-0'>
            A reference list of functional mailboxes not tied to a specific user - sales, no-reply, inquiry, etc.
            Saves their address and password for your own reference only - it doesn't create, change, or delete
            anything on the mail server itself.
          </p>
        </div>
        {mailDomain && (
          <Button color='primary' size='sm' onClick={openAddModal}>
            <Plus size={14} className='me-50' />
            Add Mailbox
          </Button>
        )}
      </div>

      {!mailDomain ? (
        <p className='text-muted small'>
          Set the mailbox domain under Mailbox Provisioning first to add admin emails here.
        </p>
      ) : mailboxes.length ? (
        <Table responsive className='mb-0'>
          <thead>
            <tr>
              <th>Email</th>
              <th>Label</th>
              <th className='text-end'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mailboxes.map(mailbox => (
              <tr key={mailbox.id}>
                <td>
                  <Mail size={14} className='me-50 text-muted' />
                  {mailbox.email}
                </td>
                <td>{mailbox.label || <span className='text-muted'>-</span>}</td>
                <td className='text-end'>
                  <Button
                    color='flat-primary'
                    size='sm'
                    className='btn-icon'
                    onClick={() => openEditModal(mailbox)}
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button color='flat-danger' size='sm' className='btn-icon' onClick={() => handleDelete(mailbox)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className='text-muted small'>No admin mailboxes yet.</p>
      )}

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered>
        <ModalHeader toggle={() => setModalOpen(false)}>{editingId ? 'Edit Mailbox' : 'Add Mailbox'}</ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <div className='mb-1'>
              <Label className='form-label' for='local_part'>
                Email <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='local_part'
                control={control}
                render={({ field }) => (
                  <InputGroup>
                    <Input id='local_part' placeholder='sales' invalid={errors.local_part && true} {...field} />
                    <InputGroupText>{`@${mailDomain}`}</InputGroupText>
                  </InputGroup>
                )}
              />
              <FormText color={errors.local_part ? 'danger' : 'muted'}>{errors.local_part?.message || ''}</FormText>
            </div>
            <div className='mb-1'>
              <Label className='form-label' for='label'>
                Label
              </Label>
              <Controller
                name='label'
                control={control}
                render={({ field }) => <Input id='label' placeholder='Sales Inquiries' {...field} />}
              />
              <FormText color='muted'>Optional - just to help tell mailboxes apart in this list.</FormText>
            </div>
            <div className='mb-1'>
              <Label className='form-label' for='mailbox_password'>
                Password {!editingId && <span className='text-danger'>*</span>}
              </Label>
              <Controller
                name='password'
                control={control}
                render={({ field }) => (
                  <InputPasswordToggle id='mailbox_password' invalid={errors.password && true} {...field} />
                )}
              />
              <FormText color={errors.password ? 'danger' : 'muted'}>
                {errors.password?.message ||
                  (editingId ? 'Leave blank to keep the current password.' : 'Saved for reference only.')}
              </FormText>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color='primary' type='submit' disabled={saving}>
              {saving ? <Spinner size='sm' /> : editingId ? 'Save' : 'Add'}
            </Button>
            <Button color='secondary' outline onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminEmailsTab
