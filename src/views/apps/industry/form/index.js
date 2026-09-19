import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { selectThemeColors } from '@utils'
import { addIndustry, updateIndustry, getIndustry } from '../store'

const statusOptions = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' }
]

const defaultValues = { name: '' }

const IndustryForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.industries)

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
    if (isEdit) dispatch(getIndustry(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedIndustry && store.selectedIndustry.id === Number(id)) {
      const industry = store.selectedIndustry
      reset({ name: industry.name || '' })
      setValue('is_active', industry.is_active !== false)
    }
  }, [store.selectedIndustry])

  const onSubmit = data => {
    if (data.name.length > 0) {
      const payload = {
        name: data.name,
        is_active: isActive !== false
      }

      const action = isEdit ? updateIndustry({ id: Number(id), ...payload }) : addIndustry(payload)
      dispatch(action).then(() => {
        toast.success(isEdit ? 'Industry updated' : 'Industry added')
        navigate('/industry')
      })
    } else {
      setError('name', { type: 'manual' })
    }
  }

  const selectedStatusOption = statusOptions.find(i => i.value === (isActive !== false)) || statusOptions[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Industry' : 'Add New Industry'}</CardTitle>
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
                  <Input id='name' placeholder='Technology' invalid={errors.name && true} {...field} />
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
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default IndustryForm