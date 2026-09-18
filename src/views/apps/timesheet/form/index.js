// ** React Imports
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ** Hooks
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import useHolidayDates from '@hooks/useHolidayDates'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { Editor } from '@veztraa/editor'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, FormText } from 'reactstrap'

// ** Utils
import { selectThemeColors, getUserData, uploadEditorImage } from '@utils'

// ** Shared Components
import DateField from '../../shared/DateField'

// ** Store & Actions
import { addTimesheet, updateTimesheet, getTimesheet } from '../store'

const defaultValues = {
  user_id: '',
  project_id: '',
  activity_id: '',
  date: '',
  hours: ''
}

const TimesheetForm = () => {
  // ** Hooks & Vars
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.timesheets)

  const [userOptions, setUserOptions] = useState([])
  const [projectOptions, setProjectOptions] = useState([])
  const [activityOptions, setActivityOptions] = useState([])
  const [description, setDescription] = useState('')
  // Tracks edits to description, which isn't registered with react-hook-form
  // so its own isDirty can't see it.
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

  // Only an admin may log time against someone else's name - matches the
  // backend's own enforcement in TimesheetController (this alone would just
  // be a UI nicety; the real restriction has to live server-side too, since
  // a disabled field here is trivial to bypass with a raw request).
  const isAdmin = (getUserData()?.role || '').toLowerCase() === 'admin'

  // Only holidays block a timesheet date - unlike Todo/Kanban due dates,
  // logging hours worked over a weekend is normal (overtime, on-call,
  // catching up), so weekend days are deliberately NOT disabled here (see
  // useWeekendDays() in those two forms for the contrast).
  const { holidayDates } = useHolidayDates()

  const userId = watch('user_id')
  const projectId = watch('project_id')
  const activityId = watch('activity_id')

  // ** Fetch users, projects, and active activities for the selects
  useEffect(() => {
    axios.get('/users', { params: { perPage: 100 } }).then(response => {
      setUserOptions(response.data.data.users.map(u => ({ value: u.id, label: u.fullName })))
    })
    axios.get('/projects', { params: { perPage: 100 } }).then(response => {
      setProjectOptions(response.data.data.projects.map(p => ({ value: p.id, label: p.name })))
    })
    axios.get('/timesheet-activities', { params: { perPage: 100 } }).then(response => {
      const active = response.data.data.timesheetActivities.filter(a => a.is_active)
      setActivityOptions(active.map(a => ({ value: a.id, label: a.name })))
    })
  }, [])

  // ** Add mode: default the User field to whoever is logged in - still
  // changeable, e.g. for an admin logging time on someone else's behalf.
  useEffect(() => {
    if (!isEdit) {
      const currentUser = getUserData()
      if (currentUser?.id) setValue('user_id', currentUser.id)
    }
  }, [isEdit])

  // ** Fetch the timesheet entry being edited
  useEffect(() => {
    if (isEdit) dispatch(getTimesheet(id))
  }, [id])

  // ** Populate the form once the entry loads
  useEffect(() => {
    if (isEdit && store.selectedTimesheet && store.selectedTimesheet.id === Number(id)) {
      const t = store.selectedTimesheet
      reset({
        date: t.date || '',
        hours: t.hours ?? ''
      })
      setDescription(t.description || '')
      setValue('user_id', t.user_id || '')
      setValue('project_id', t.project_id || '')
      setValue('activity_id', t.activity_id || '')
    }
  }, [store.selectedTimesheet])

  const checkIsValid = data =>
    userId && projectId && activityId && data.date && Number(data.hours) > 0 && Number(data.hours) <= 24

  const onSubmit = data => {
    if (checkIsValid(data)) {
      const payload = {
        user_id: userId,
        project_id: projectId,
        activity_id: activityId,
        date: data.date,
        hours: Number(data.hours),
        description
      }

      const action = isEdit ? updateTimesheet({ id: Number(id), ...payload }) : addTimesheet(payload)
      dispatch(action)
        .unwrap()
        .then(() => {
          toast.success(isEdit ? 'Timesheet entry updated' : 'Timesheet entry added')
          navigate('/timesheet')
        })
        .catch(err => {
          // The one real failure this form can hit that isn't already
          // caught by checkIsValid() above - trying to edit someone else's
          // entry as a non-admin (see TimesheetController::update()).
          toast.error(err?.message || (isEdit ? 'Failed to update timesheet entry' : 'Failed to add timesheet entry'))
        })
    } else {
      if (!userId) setError('user_id', { type: 'manual' })
      if (!projectId) setError('project_id', { type: 'manual' })
      if (!activityId) setError('activity_id', { type: 'manual' })
      if (!data.date) setError('date', { type: 'manual' })
      if (!(Number(data.hours) > 0 && Number(data.hours) <= 24)) setError('hours', { type: 'manual' })
    }
  }

  const selectedUserOption = userOptions.find(o => o.value === userId) || null
  const selectedProjectOption = projectOptions.find(o => o.value === projectId) || null
  const selectedActivityOption = activityOptions.find(o => o.value === activityId) || null

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Timesheet Entry' : 'Add Timesheet Entry'}</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='user_id'>
                User <span className='text-danger'>*</span>
              </Label>
              <Select
                inputId='user_id'
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                options={userOptions}
                value={selectedUserOption}
                onChange={option => setValue('user_id', option ? option.value : '', { shouldDirty: true })}
                placeholder='Select user...'
                isDisabled={!isAdmin}
              />
              {!isAdmin && (
                <FormText color='muted'>Only an admin can log time against someone else.</FormText>
              )}
              {errors.user_id && <small className='text-danger'>Please select a user</small>}
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='project_id'>
                Project <span className='text-danger'>*</span>
              </Label>
              <Select
                inputId='project_id'
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                options={projectOptions}
                value={selectedProjectOption}
                onChange={option => setValue('project_id', option ? option.value : '', { shouldDirty: true })}
                placeholder='Select project...'
              />
              {errors.project_id && <small className='text-danger'>Please select a project</small>}
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='date'>
                Date <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='date'
                control={control}
                render={({ field }) => (
                  <DateField
                    id='date'
                    value={field.value}
                    onChange={field.onChange}
                    invalid={errors.date && true}
                    options={{ disable: holidayDates }}
                  />
                )}
              />
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='activity_id'>
                Activity <span className='text-danger'>*</span>
              </Label>
              <Select
                inputId='activity_id'
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                options={activityOptions}
                value={selectedActivityOption}
                onChange={option => setValue('activity_id', option ? option.value : '', { shouldDirty: true })}
                placeholder='Select activity...'
              />
              {errors.activity_id && <small className='text-danger'>Please select an activity</small>}
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='hours'>
                Hours <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='hours'
                control={control}
                render={({ field }) => (
                  <Input
                    type='number'
                    step='0.25'
                    min='0'
                    max='24'
                    id='hours'
                    placeholder='8'
                    invalid={errors.hours && true}
                    {...field}
                  />
                )}
              />
              {errors.hours && <small className='text-danger'>Enter hours between 0 and 24</small>}
            </Col>
            <Col md={12} className='mb-1'>
              <Label className='form-label' for='description'>
                Description
              </Label>
              <Editor
                value={description}
                onChange={value => {
                  setDescription(value)
                  setExtraDirty(true)
                }}
                height={400}
                onImageUpload={uploadEditorImage}
              />
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default TimesheetForm
