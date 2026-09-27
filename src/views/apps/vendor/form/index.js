import { Fragment, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { selectThemeColors } from '@utils'
import { addVendor, updateVendor, getVendor } from '../store'
import HistoryModal from '../../activity-log/HistoryModal'

const statusOptions = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' }
]

const defaultValues = { name: '', email: '', phone: '', address: '', notes: '' }

const VendorForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.vendors)

  const {
    control,
    reset,
    setValue,
    setError,
    handleSubmit,
    watch,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty)

  const isActive = watch('is_active')

  useEffect(() => {
    if (isEdit) dispatch(getVendor(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedVendor && store.selectedVendor.id === Number(id)) {
      const vendor = store.selectedVendor
      reset({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        notes: vendor.notes || ''
      })
      setValue('is_active', vendor.is_active !== false)
    }
  }, [store.selectedVendor])

  const onSubmit = data => {
    if (data.name.length > 0) {
      const payload = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
        is_active: isActive !== false
      }

      const action = isEdit ? updateVendor({ id: Number(id), ...payload }) : addVendor(payload)
      dispatch(action).then(() => {
        toast.success(isEdit ? 'Vendor updated' : 'Vendor added')
        navigate('/vendor')
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
          <CardTitle tag='h4'>{isEdit ? 'Edit Vendor' : 'Add New Vendor'}</CardTitle>
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='name'>
                  Vendor Name <span className='text-danger'>*</span>
                </Label>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <Input id='name' placeholder='Acme Supplies' invalid={errors.name && true} {...field} />
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
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='email'>
                  Email
                </Label>
                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => <Input id='email' type='email' placeholder='billing@acme.com' {...field} />}
                />
              </Col>
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='phone'>
                  Phone
                </Label>
                <Controller
                  name='phone'
                  control={control}
                  render={({ field }) => <Input id='phone' placeholder='+1 555 000 0000' {...field} />}
                />
              </Col>
              <Col md={12} className='mb-1'>
                <Label className='form-label' for='address'>
                  Address
                </Label>
                <Controller
                  name='address'
                  control={control}
                  render={({ field }) => <Input id='address' type='textarea' rows='2' {...field} />}
                />
              </Col>
              <Col md={12}>
                <Label className='form-label' for='notes'>
                  Notes
                </Label>
                <Controller
                  name='notes'
                  control={control}
                  render={({ field }) => <Input id='notes' type='textarea' rows='3' {...field} />}
                />
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
      {isEdit && <HistoryModal entityType='vendor' entityId={Number(id)} buttonId='vendor-history-btn' />}
    </Fragment>
  )
}

export default VendorForm
