import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { Copy, Check, AlertTriangle } from 'react-feather'
import { Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, Button, Alert } from 'reactstrap'
import { addApiKey } from './store'

const defaultValues = { name: '', expires_at: '' }

// Two steps in one modal: a create form, then (on success) a one-time
// reveal of the raw secret - it's never retrievable again after this, same
// as veztraa-admin's own API key UX. The secret only ever lives in this
// component's local state (`createdKey`), never in Redux, so closing the
// modal is the only way it disappears for good - no refetch or devtools
// inspection can bring it back.
const CreateApiKeyModal = ({ isOpen, toggle }) => {
  const dispatch = useDispatch()
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues })

  const [createdKey, setCreatedKey] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleClose = () => {
    setCreatedKey(null)
    setCopied(false)
    reset(defaultValues)
    toggle()
  }

  const onSubmit = data => {
    const payload = { name: data.name }
    if (data.expires_at) payload.expires_at = data.expires_at

    dispatch(addApiKey(payload))
      .unwrap()
      .then(result => setCreatedKey(result))
      .catch(err => toast.error(err?.response?.data?.message || 'Failed to create API key'))
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(createdKey.token)
      setCopied(true)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy - select and copy manually')
    }
  }

  return (
    <Modal isOpen={isOpen} toggle={createdKey ? undefined : handleClose} backdrop={createdKey ? 'static' : true}>
      <ModalHeader toggle={createdKey ? undefined : handleClose}>
        {createdKey ? 'API Key Created' : 'Create API Key'}
      </ModalHeader>

      {createdKey ? (
        <>
          <ModalBody>
            <Alert color='warning' className='d-flex align-items-start'>
              <AlertTriangle size={18} className='me-50 flex-shrink-0' />
              <span>This is the only time the full key is shown. Copy it now - it can't be retrieved again later.</span>
            </Alert>
            <Label className='form-label'>Secret Key</Label>
            <div className='d-flex'>
              <Input readOnly value={createdKey.token} className='font-monospace' onFocus={e => e.target.select()} />
              <Button color={copied ? 'success' : 'primary'} className='ms-50 text-nowrap' onClick={handleCopy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color='primary' onClick={handleClose}>
              Done
            </Button>
          </ModalFooter>
        </>
      ) : (
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <div className='mb-1'>
              <Label className='form-label' for='api-key-name'>
                Name
              </Label>
              <Controller
                name='name'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Input id='api-key-name' placeholder='e.g. Company Website' invalid={Boolean(errors.name)} {...field} />
                )}
              />
              {errors.name && <small className='text-danger'>Name is required.</small>}
            </div>
            <div className='mb-1'>
              <Label className='form-label' for='api-key-expires'>
                Expires On <span className='text-muted'>(optional)</span>
              </Label>
              <Controller
                name='expires_at'
                control={control}
                render={({ field }) => <Input id='api-key-expires' type='date' {...field} />}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color='secondary' outline onClick={handleClose} type='button'>
              Cancel
            </Button>
            <Button color='primary' type='submit' disabled={isSubmitting}>
              Create
            </Button>
          </ModalFooter>
        </Form>
      )}
    </Modal>
  )
}

export default CreateApiKeyModal
