// ** React Imports
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ** Hooks
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { Editor } from '@veztraa/editor'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'

// ** Utils
import { selectThemeColors } from '@utils'

// ** Custom Components
import ProjectDocuments from './ProjectDocuments'

// ** Store & Actions
import { addProject, updateProject, getProject } from '../store'

// ** Options
import { statusOptions } from '../statusOptions'
import { budgetTypeOptions } from '../budgetTypeOptions'

const defaultValues = {
  name: '',
  start_date: '',
  end_date: '',
  budget: ''
}

const ProjectForm = () => {
  // ** Hooks & Vars
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.projects)

  const [clientOptions, setClientOptions] = useState([])
  const [currencyOptions, setCurrencyOptions] = useState([])
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

  const clientId = watch('client_id')
  const status = watch('status')
  const currency = watch('currency')
  const budgetType = watch('budget_type')

  // ** Fetch clients and currencies for their selects
  useEffect(() => {
    axios.get('/clients', { params: { perPage: 100 } }).then(response => {
      const clients = response.data.data.clients
      setClientOptions(clients.map(c => ({ value: c.id, label: c.fullName || `${c.first_name} ${c.last_name}` })))
    })
    axios.get('/currencies', { params: { perPage: 100 } }).then(response => {
      setCurrencyOptions(
        response.data.data.currencies
          .filter(c => c.is_active)
          .map(c => ({ value: c.icon, label: `${c.name} (${c.icon})` }))
      )
    })
  }, [])

  // ** Fetch the project being edited
  useEffect(() => {
    if (isEdit) dispatch(getProject(id))
  }, [id])

  // ** Populate the form once the project loads
  useEffect(() => {
    if (isEdit && store.selectedProject && store.selectedProject.id === Number(id)) {
      const project = store.selectedProject
      reset({
        name: project.name || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        budget: project.budget ?? ''
      })
      setDescription(project.description || '')
      setValue('client_id', project.client_id || '')
      setValue('status', project.status || 'planning')
      setValue('currency', project.currency || 'USD')
      setValue('budget_type', project.budget_type || '')
    }
  }, [store.selectedProject])

  const checkIsValid = data => data.name.length > 0

  const onSubmit = data => {
    if (checkIsValid(data)) {
      const payload = {
        name: data.name,
        description,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        budget: data.budget === '' ? null : Number(data.budget),
        currency: currency || 'USD',
        budget_type: budgetType || null,
        client_id: clientId || null,
        status: status || 'planning'
      }

      const action = isEdit ? updateProject({ id: Number(id), ...payload }) : addProject(payload)
      dispatch(action).then(() => {
      toast.success(isEdit ? 'Project updated' : 'Project added')
      navigate('/project')
    })
    } else {
      setError('name', { type: 'manual' })
    }
  }

  const selectedClientOption = clientOptions.find(i => i.value === clientId) || null
  const selectedStatusOption = statusOptions.find(i => i.value === status) || null
  const selectedCurrencyOption = currencyOptions.find(i => i.value === currency) || null
  const selectedBudgetTypeOption = budgetTypeOptions.find(i => i.value === budgetType) || null

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Project' : 'Add New Project'}</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='name'>
                Project Name <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <Input id='name' placeholder='Website Redesign' invalid={errors.name && true} {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='client_id'>
                Client
              </Label>
              <Select
                inputId='client_id'
                isClearable
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                options={clientOptions}
                value={selectedClientOption}
                onChange={option => setValue('client_id', option ? option.value : '', { shouldDirty: true })}
                placeholder='Select client...'
              />
            </Col>
            <Col md={4} className='mb-1'>
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
                onChange={option => setValue('status', option ? option.value : 'planning', { shouldDirty: true })}
                placeholder='Select status...'
              />
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='start_date'>
                Start Date
              </Label>
              <Controller
                name='start_date'
                control={control}
                render={({ field }) => <Input type='date' id='start_date' {...field} />}
              />
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='end_date'>
                End Date
              </Label>
              <Controller
                name='end_date'
                control={control}
                render={({ field }) => <Input type='date' id='end_date' {...field} />}
              />
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='currency'>
                Currency
              </Label>
              <Select
                inputId='currency'
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                options={currencyOptions}
                value={selectedCurrencyOption}
                onChange={option => setValue('currency', option ? option.value : 'USD', { shouldDirty: true })}
                placeholder='Select currency...'
              />
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='budget_type'>
                Budget Type
              </Label>
              <Select
                inputId='budget_type'
                isClearable
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                options={budgetTypeOptions}
                value={selectedBudgetTypeOption}
                onChange={option => setValue('budget_type', option ? option.value : '', { shouldDirty: true })}
                placeholder='Select budget type...'
              />
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='budget'>
                Budget
              </Label>
              <Controller
                name='budget'
                control={control}
                render={({ field }) => <Input type='number' step='0.01' id='budget' placeholder='15000' {...field} />}
              />
            </Col>
            <Col md={12} className='mb-1'>
              <Label className='form-label'>Description</Label>
              <Editor
                value={description}
                onChange={value => {
                  setDescription(value)
                  setExtraDirty(true)
                }}
                height={400}
              />
            </Col>
            <Col md={12}>
              <hr className='my-1' />
              <h6 className='mb-1'>Project Documents</h6>
              {isEdit ? (
                <ProjectDocuments projectId={Number(id)} />
              ) : (
                <p className='text-muted small mb-0'>Save the project first to attach documents.</p>
              )}
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default ProjectForm
