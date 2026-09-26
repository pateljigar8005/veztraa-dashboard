import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import Select, { components } from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { selectThemeColors } from '@utils'
import HistoryModal from '../../activity-log/HistoryModal'
import { addLeaveType, updateLeaveType, getLeaveType } from '../store'

// Bootstrap contextual color names, not hex values - same convention as
// Event Categories: the color renders via `bg-light-{color}`/`bullet-{color}`
// utility classes elsewhere in the app, so it must be one of these to render.
const colorOptions = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'success', label: 'Success' },
  { value: 'danger', label: 'Danger' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'dark', label: 'Dark' }
]

const ColorOption = ({ data, ...props }) => (
  <components.Option {...props}>
    <span className={`bullet bullet-${data.value} bullet-sm me-50`}></span>
    {data.label}
  </components.Option>
)

const defaultValues = { name: '', color: 'success', is_paid: true, affects_balance: true, is_active: true }

const LeaveTypeForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.leaveTypes)

  const {
    control,
    reset,
    setValue,
    watch,
    setError,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty)

  const color = watch('color')

  useEffect(() => {
    if (isEdit) dispatch(getLeaveType(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedLeaveType && store.selectedLeaveType.id === Number(id)) {
      const leaveType = store.selectedLeaveType
      reset({
        name: leaveType.name || '',
        color: leaveType.color || 'success',
        is_paid: Boolean(leaveType.is_paid),
        affects_balance: Boolean(leaveType.affects_balance),
        is_active: Boolean(leaveType.is_active)
      })
    }
  }, [store.selectedLeaveType])

  const onSubmit = data => {
    if (data.name.length > 0) {
      const payload = {
        name: data.name,
        color: data.color || 'success',
        is_paid: data.is_paid,
        affects_balance: data.affects_balance,
        is_active: data.is_active
      }
      const action = isEdit ? updateLeaveType({ id: Number(id), ...payload }) : addLeaveType(payload)
      dispatch(action)
        .unwrap()
        .then(() => {
          toast.success(isEdit ? 'Leave type updated' : 'Leave type added')
          navigate('/leave-type')
        })
        .catch(err => {
          if (err?.errors?.name) {
            setError('name', { type: 'manual', message: err.errors.name[0] })
          } else {
            toast.error(err?.message || (isEdit ? 'Failed to update leave type' : 'Failed to add leave type'))
          }
        })
    } else {
      setError('name', { type: 'manual' })
    }
  }

  const selectedColorOption = colorOptions.find(i => i.value === color) || colorOptions[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Leave Type' : 'Add New Leave Type'}</CardTitle>
        {isEdit && <HistoryModal entityType='leave_type' entityId={Number(id)} buttonId='leave-type-history-btn' />}
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
                  <Input id='name' placeholder='e.g. PL, Sick Leave' invalid={errors.name && true} {...field} />
                )}
              />
              {errors.name?.message && <small className='text-danger'>{errors.name.message}</small>}
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='color'>
                Color
              </Label>
              <Select
                inputId='color'
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                options={colorOptions}
                value={selectedColorOption}
                onChange={option => setValue('color', option.value, { shouldDirty: true })}
                isSearchable={false}
                components={{
                  Option: ColorOption,
                  SingleValue: props => (
                    <components.SingleValue {...props}>
                      <span className={`bullet bullet-${props.data.value} bullet-sm me-50`}></span>
                      {props.data.label}
                    </components.SingleValue>
                  )
                }}
              />
            </Col>
          </Row>
          <Row>
            <Col md={4} className='mb-1'>
              <div className='form-switch d-flex align-items-center'>
                <Controller
                  name='is_paid'
                  control={control}
                  render={({ field }) => (
                    <Input type='switch' id='is_paid' checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                  )}
                />
                <Label className='form-check-label mb-0 ms-50' for='is_paid'>
                  Paid Leave
                </Label>
              </div>
            </Col>
            <Col md={4} className='mb-1'>
              <div className='form-switch d-flex align-items-center'>
                <Controller
                  name='affects_balance'
                  control={control}
                  render={({ field }) => (
                    <Input
                      type='switch'
                      id='affects_balance'
                      checked={field.value}
                      onChange={e => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <Label className='form-check-label mb-0 ms-50' for='affects_balance'>
                  Deducts from PL Balance
                </Label>
              </div>
            </Col>
            <Col md={4} className='mb-1'>
              <div className='form-switch d-flex align-items-center'>
                <Controller
                  name='is_active'
                  control={control}
                  render={({ field }) => (
                    <Input type='switch' id='is_active' checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                  )}
                />
                <Label className='form-check-label mb-0 ms-50' for='is_active'>
                  Active
                </Label>
              </div>
            </Col>
          </Row>
          <p className='text-muted small mb-0'>
            Only leave types with "Deducts from PL Balance" enabled reduce an employee's PL balance when approved.
          </p>
        </Form>
      </CardBody>
    </Card>
  )
}

export default LeaveTypeForm
