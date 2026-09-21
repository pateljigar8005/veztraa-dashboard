import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, FormText } from 'reactstrap'
import DateField from '../../shared/DateField'
import HistoryModal from '../../activity-log/HistoryModal'
import { addHoliday, updateHoliday, getHoliday } from '../store'

const defaultValues = { name: '', date: '' }

const HolidayForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.holidays)

  const {
    control,
    reset,
    setError,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty)

  useEffect(() => {
    if (isEdit) dispatch(getHoliday(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedHoliday && store.selectedHoliday.id === Number(id)) {
      const holiday = store.selectedHoliday
      reset({ name: holiday.name || '', date: holiday.date || '' })
    }
  }, [store.selectedHoliday])

  const onSubmit = data => {
    if (data.name.length > 0 && data.date.length > 0) {
      const payload = { name: data.name, date: data.date }
      const action = isEdit ? updateHoliday({ id: Number(id), ...payload }) : addHoliday(payload)
      dispatch(action)
        .unwrap()
        .then(() => {
          toast.success(isEdit ? 'Holiday updated' : 'Holiday added')
          navigate('/holiday')
        })
        .catch(err => {
          if (err?.errors?.date) {
            setError('date', { type: 'manual', message: err.errors.date[0] })
          } else {
            toast.error(err?.message || (isEdit ? 'Failed to update holiday' : 'Failed to add holiday'))
          }
        })
    } else {
      if (!data.name.length) setError('name', { type: 'manual' })
      if (!data.date.length) setError('date', { type: 'manual' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Holiday' : 'Add New Holiday'}</CardTitle>
        {isEdit && <HistoryModal entityType='holiday' entityId={Number(id)} buttonId='holiday-history-btn' />}
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='name'>
                Holiday Name <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <Input id='name' placeholder='Diwali' invalid={errors.name && true} {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='date'>
                Date <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='date'
                control={control}
                render={({ field }) => (
                  <DateField id='date' value={field.value} onChange={field.onChange} invalid={errors.date && true} />
                )}
              />
              {errors.date?.message && <FormText color='danger'>{errors.date.message}</FormText>}
            </Col>
          </Row>
          <p className='text-muted small mb-0'>
            This date is blocked from Todo/Kanban due dates and shown as a holiday on the Calendar for everyone,
            company-wide.
          </p>
        </Form>
      </CardBody>
    </Card>
  )
}

export default HolidayForm