// ** React Imports
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ** Hooks
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'

// ** Third Party Components
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'

// ** Utils
import { selectThemeColors } from '@utils'

// ** Store & Actions
import { addCurrency, updateCurrency, getCurrency } from '../store'

const statusOptions = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' }
]

const defaultValues = {
  name: '',
  icon: '',
  rate: '1.00'
}

const CurrencyForm = () => {
  // ** Hooks & Vars
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.currencies)

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

  // ** Fetch the currency being edited
  useEffect(() => {
    if (isEdit) dispatch(getCurrency(id))
  }, [id])

  // ** Populate the form once the currency loads
  useEffect(() => {
    if (isEdit && store.selectedCurrency && store.selectedCurrency.id === Number(id)) {
      const currency = store.selectedCurrency
      reset({
        name: currency.name || '',
        icon: currency.icon || '',
        rate: currency.rate !== undefined && currency.rate !== null ? Number(currency.rate).toFixed(2) : '1.00'
      })
      setValue('is_active', currency.is_active !== false)
    }
  }, [store.selectedCurrency])

  const checkIsValid = data => ['name', 'icon', 'rate'].every(key => String(data[key]).length > 0)

  const onSubmit = data => {
    if (checkIsValid(data)) {
      const payload = {
        name: data.name,
        icon: data.icon,
        rate: Math.round(Number(data.rate) * 100) / 100,
        is_active: isActive !== false
      }

      const action = isEdit ? updateCurrency({ id: Number(id), ...payload }) : addCurrency(payload)
      dispatch(action).then(() => {
        toast.success(isEdit ? 'Currency updated' : 'Currency added')
        navigate('/currency')
      })
    } else {
      for (const key in data) {
        if (String(data[key]).length === 0) {
          setError(key, { type: 'manual' })
        }
      }
    }
  }

  const selectedStatusOption = statusOptions.find(i => i.value === (isActive !== false)) || statusOptions[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Currency' : 'Add New Currency'}</CardTitle>
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
                  <Input id='name' placeholder='US Dollar' invalid={errors.name && true} {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='icon'>
                Icon <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='icon'
                control={control}
                render={({ field }) => <Input id='icon' placeholder='$' invalid={errors.icon && true} {...field} />}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='rate'>
                Rate <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='rate'
                control={control}
                render={({ field }) => (
                  <Input id='rate' type='number' step='0.01' placeholder='1.00' invalid={errors.rate && true} {...field} />
                )}
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

export default CurrencyForm
