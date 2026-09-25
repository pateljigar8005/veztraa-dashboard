import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { Editor } from '@veztraa/editor'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { selectThemeColors, uploadEditorImage } from '@utils'
import { addPaymentMethod, updatePaymentMethod, getPaymentMethod } from '../store'
import HistoryModal from '../../activity-log/HistoryModal'

const statusOptions = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' }
]

const defaultValues = { name: '' }

const PaymentMethodForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.paymentMethods)

  const [description, setDescription] = useState('')
  const [extraDirty, setExtraDirty] = useState(false)

  const {
    control,
    reset,
    setValue,
    setError,
    handleSubmit,
    watch,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty || extraDirty)

  const isActive = watch('is_active')

  useEffect(() => {
    if (isEdit) dispatch(getPaymentMethod(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedPaymentMethod && store.selectedPaymentMethod.id === Number(id)) {
      const method = store.selectedPaymentMethod
      reset({ name: method.name || '' })
      setDescription(method.description || '')
      setValue('is_active', method.is_active !== false)
    }
  }, [store.selectedPaymentMethod])

  const onSubmit = data => {
    if (data.name.length > 0) {
      const payload = {
        name: data.name,
        description,
        is_active: isActive !== false
      }

      const action = isEdit ? updatePaymentMethod({ id: Number(id), ...payload }) : addPaymentMethod(payload)
      dispatch(action).then(() => {
        toast.success(isEdit ? 'Payment Method updated' : 'Payment Method added')
        navigate('/payment-method')
      })
    } else {
      setError('name', { type: 'manual' })
    }
  }

  const selectedStatusOption = statusOptions.find(i => i.value === (isActive !== false)) || statusOptions[0]

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>{isEdit ? 'Edit Payment Method' : 'Add New Payment Method'}</CardTitle>
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='name'>
                  Name <span className='text-danger'>*</span>
                </Label>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <Input id='name' placeholder='Bank Transfer' invalid={errors.name && true} {...field} />
                  )}
                />
              </Col>
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='status'>
                  Status
                </Label>
                <Select
                  inputId='status'
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={statusOptions}
                  value={selectedStatusOption}
                  onChange={option => setValue('is_active', option.value, { shouldDirty: true })}
                  isSearchable={false}
                />
              </Col>
              <Col md={12}>
                <Label className='form-label'>Description</Label>
                <Editor
                  value={description}
                  onChange={value => {
                    setDescription(value)
                    setExtraDirty(true)
                  }}
                  height={500}
                  onImageUpload={uploadEditorImage}
                />
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
      {isEdit && <HistoryModal entityType='payment_method' entityId={Number(id)} buttonId='payment-method-history-btn' />}
    </Fragment>
  )
}

export default PaymentMethodForm