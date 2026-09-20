import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import Select, { components } from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { selectThemeColors } from '@utils'
import { addEventCategory, updateEventCategory, getEventCategory } from '../store'

const statusOptions = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' }
]

// Bootstrap contextual color names, not hex values - the Calendar renders a
// category as `bg-light-{color}`/`bullet-{color}` (existing Vuexy utility
// classes), so the color must be one of these to actually render.
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

const defaultValues = { name: '' }

const EventCategoryForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.eventCategories)

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
  const color = watch('color')

  useEffect(() => {
    if (isEdit) dispatch(getEventCategory(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedEventCategory && store.selectedEventCategory.id === Number(id)) {
      const category = store.selectedEventCategory
      reset({ name: category.name || '' })
      setValue('color', category.color || 'primary')
      setValue('is_active', category.is_active !== false)
    } else if (!isEdit) {
      setValue('color', 'primary')
    }
  }, [store.selectedEventCategory])

  const onSubmit = data => {
    if (data.name.length > 0) {
      const payload = {
        name: data.name,
        color: color || 'primary',
        is_active: isActive !== false
      }

      const action = isEdit ? updateEventCategory({ id: Number(id), ...payload }) : addEventCategory(payload)
      dispatch(action).then(() => {
        toast.success(isEdit ? 'Event category updated' : 'Event category added')
        navigate('/event-category')
      })
    } else {
      setError('name', { type: 'manual' })
    }
  }

  const selectedStatusOption = statusOptions.find(i => i.value === (isActive !== false)) || statusOptions[0]
  const selectedColorOption = colorOptions.find(i => i.value === color) || colorOptions[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Event Category' : 'Add New Event Category'}</CardTitle>
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
                  <Input id='name' placeholder='Meeting' invalid={errors.name && true} {...field} />
                )}
              />
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
                components={{ Option: ColorOption, SingleValue: props => (
                  <components.SingleValue {...props}>
                    <span className={`bullet bullet-${props.data.value} bullet-sm me-50`}></span>
                    {props.data.label}
                  </components.SingleValue>
                ) }}
              />
            </Col>
            <Col md={6}>
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
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default EventCategoryForm
