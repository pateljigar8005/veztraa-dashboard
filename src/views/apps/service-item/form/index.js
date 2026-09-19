import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { selectThemeColors } from '@utils'
import AmountField from '../../shared/AmountField'
import { addServiceItem, updateServiceItem, getServiceItem } from '../store'
import { categoryOptions, unitOptions } from '../serviceItemOptions'

const defaultValues = {
  name: '',
  description: '',
  price: ''
}

const ServiceItemForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.serviceItems)

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

  const category = watch('category')
  const unit = watch('unit')

  useEffect(() => {
    if (isEdit) dispatch(getServiceItem(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedServiceItem && store.selectedServiceItem.id === Number(id)) {
      const item = store.selectedServiceItem
      reset({
        name: item.name || '',
        description: item.description || '',
        price: item.price ?? ''
      })
      setValue('category', item.category || '')
      setValue('unit', item.unit || '')
    }
  }, [store.selectedServiceItem])

  const checkIsValid = data => data.name.length > 0

  const onSubmit = data => {
    if (checkIsValid(data)) {
      const payload = {
        name: data.name,
        description: data.description,
        price: data.price === '' ? 0 : Number(data.price),
        category: category || null,
        unit: unit || null
      }

      const action = isEdit ? updateServiceItem({ id: Number(id), ...payload }) : addServiceItem(payload)
      dispatch(action).then(() => {
      toast.success(isEdit ? 'Service Item updated' : 'Service Item added')
      navigate('/service-item')
    })
    } else {
      setError('name', { type: 'manual' })
    }
  }

  const selectedCategoryOption = categoryOptions.find(i => i.value === category) || null
  const selectedUnitOption = unitOptions.find(i => i.value === unit) || null

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Service Item' : 'Add New Service Item'}</CardTitle>
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
                  <Input id='name' placeholder='Web Development' invalid={errors.name && true} {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='category'>
                Category
              </Label>
              <Select
                inputId='category'
                isClearable
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                options={categoryOptions}
                value={selectedCategoryOption}
                onChange={option => setValue('category', option ? option.value : '', { shouldDirty: true })}
                placeholder='Select category...'
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='price'>
                Price
              </Label>
              <Controller
                name='price'
                control={control}
                render={({ field }) => (
                  <AmountField id='price' placeholder='75.00' value={field.value} onChange={field.onChange} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='unit'>
                Unit
              </Label>
              <Select
                inputId='unit'
                isClearable
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                options={unitOptions}
                value={selectedUnitOption}
                onChange={option => setValue('unit', option ? option.value : '', { shouldDirty: true })}
                placeholder='Select unit...'
              />
            </Col>
            <Col md={12}>
              <Label className='form-label' for='description'>
                Description
              </Label>
              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <Input type='textarea' rows='3' id='description' placeholder='Custom web development services' {...field} />
                )}
              />
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default ServiceItemForm