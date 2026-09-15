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
import { addTimesheetActivity, updateTimesheetActivity, getTimesheetActivity } from '../store'

const statusOptions = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' }
]

const defaultValues = { name: '' }

const TimesheetActivityForm = () => {
  // ** Hooks & Vars
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.timesheetActivities)

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

  // ** Fetch the activity being edited
  useEffect(() => {
    if (isEdit) dispatch(getTimesheetActivity(id))
  }, [id])

  // ** Populate the form once the activity loads
  useEffect(() => {
    if (isEdit && store.selectedTimesheetActivity && store.selectedTimesheetActivity.id === Number(id)) {
      const activity = store.selectedTimesheetActivity
      reset({ name: activity.name || '' })
      setValue('is_active', activity.is_active !== false)
    }
  }, [store.selectedTimesheetActivity])

  const onSubmit = data => {
    if (data.name.length > 0) {
      const payload = {
        name: data.name,
        is_active: isActive !== false
      }

      const action = isEdit ? updateTimesheetActivity({ id: Number(id), ...payload }) : addTimesheetActivity(payload)
      dispatch(action).then(() => {
        toast.success(isEdit ? 'Timesheet activity updated' : 'Timesheet activity added')
        navigate('/timesheet-activity')
      })
    } else {
      setError('name', { type: 'manual' })
    }
  }

  const selectedStatusOption = statusOptions.find(i => i.value === (isActive !== false)) || statusOptions[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Timesheet Activity' : 'Add New Timesheet Activity'}</CardTitle>
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
                  <Input id='name' placeholder='Development' invalid={errors.name && true} {...field} />
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

export default TimesheetActivityForm
