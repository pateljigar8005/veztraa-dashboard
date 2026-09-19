import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, Button } from 'reactstrap'
import { Trash2 } from 'react-feather'
import { addJobListing, updateJobListing, getJobListing } from '../store'

const defaultValues = {
  title: '',
  positions: 1,
  location: '',
  description: ''
}

const JobListingForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.jobListings)

  const [isActive, setIsActive] = useState(true)
  const [responsibilities, setResponsibilities] = useState([''])
  const [requirements, setRequirements] = useState([''])
  const [extraDirty, setExtraDirty] = useState(false)

  const {
    control,
    reset,
    setError,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty || extraDirty)

  useEffect(() => {
    if (isEdit) dispatch(getJobListing(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedJobListing && store.selectedJobListing.id === Number(id)) {
      const job = store.selectedJobListing
      reset({
        title: job.title || '',
        positions: job.positions ?? 1,
        location: job.location || '',
        description: job.description || ''
      })
      setIsActive(job.is_active !== false)
      setResponsibilities(job.responsibilities && job.responsibilities.length > 0 ? job.responsibilities : [''])
      setRequirements(job.requirements && job.requirements.length > 0 ? job.requirements : [''])
    }
  }, [store.selectedJobListing])

  const handleResponsibilityChange = (index, value) => {
    setResponsibilities(prev => prev.map((r, i) => (i === index ? value : r)))
    setExtraDirty(true)
  }
  const handleAddResponsibility = () => {
    setResponsibilities(prev => [...prev, ''])
    setExtraDirty(true)
  }
  const handleRemoveResponsibility = index => {
    setResponsibilities(prev => prev.filter((_, i) => i !== index))
    setExtraDirty(true)
  }

  const handleRequirementChange = (index, value) => {
    setRequirements(prev => prev.map((r, i) => (i === index ? value : r)))
    setExtraDirty(true)
  }
  const handleAddRequirement = () => {
    setRequirements(prev => [...prev, ''])
    setExtraDirty(true)
  }
  const handleRemoveRequirement = index => {
    setRequirements(prev => prev.filter((_, i) => i !== index))
    setExtraDirty(true)
  }

  const onSubmit = data => {
    const cleanResponsibilities = responsibilities.map(r => r.trim()).filter(Boolean)
    const cleanRequirements = requirements.map(r => r.trim()).filter(Boolean)

    if (!data.title) {
      setError('title', { type: 'manual' })
      return
    }
    if (!data.description) {
      setError('description', { type: 'manual' })
      return
    }
    if (cleanResponsibilities.length === 0) {
      toast.error('At least one responsibility is required.')
      return
    }
    if (cleanRequirements.length === 0) {
      toast.error('At least one requirement is required.')
      return
    }

    const payload = {
      title: data.title,
      positions: Number(data.positions) || 1,
      location: data.location,
      description: data.description,
      responsibilities: cleanResponsibilities,
      requirements: cleanRequirements,
      is_active: isActive
    }

    const action = isEdit ? updateJobListing({ id: Number(id), ...payload }) : addJobListing(payload)
    dispatch(action).then(result => {
      if (result.error) return
      toast.success(isEdit ? 'Job listing updated' : 'Job listing added')
      navigate('/job-listing')
    })
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Col lg='12'>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>{isEdit ? 'Edit Job Listing' : 'Add Job Listing'}</CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md={8} className='mb-1'>
                  <Label className='form-label' for='title'>
                    Job Title <span className='text-danger'>*</span>
                  </Label>
                  <Controller
                    name='title'
                    control={control}
                    render={({ field }) => (
                      <Input id='title' placeholder='e.g. Senior Frontend Developer' invalid={errors.title && true} {...field} />
                    )}
                  />
                </Col>
                <Col md={4} className='mb-1'>
                  <Label className='form-label' for='positions'>
                    No. of Positions <span className='text-danger'>*</span>
                  </Label>
                  <Controller
                    name='positions'
                    control={control}
                    render={({ field }) => <Input type='number' min='1' step='1' id='positions' {...field} />}
                  />
                </Col>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='location'>
                    Location
                  </Label>
                  <Controller
                    name='location'
                    control={control}
                    render={({ field }) => <Input id='location' placeholder='e.g. Remote, Mumbai, Hybrid — Ahmedabad' {...field} />}
                  />
                </Col>
                <Col md={12}>
                  <Label className='form-label' for='description'>
                    Description <span className='text-danger'>*</span>
                  </Label>
                  <Controller
                    name='description'
                    control={control}
                    render={({ field }) => (
                      <Input
                        type='textarea'
                        rows='4'
                        id='description'
                        placeholder='Describe the role, team, and what the candidate will be working on...'
                        invalid={errors.description && true}
                        {...field}
                      />
                    )}
                  />
                </Col>
              </Row>

              <hr className='my-2' />
              <h6 className='mb-1'>
                Responsibilities <span className='text-danger'>*</span>
              </h6>
              {responsibilities.map((responsibility, index) => (
                <div key={index} className='d-flex align-items-center mb-1' style={{ gap: '0.5rem' }}>
                  <Input
                    placeholder='e.g. Build and maintain React components'
                    value={responsibility}
                    onChange={e => handleResponsibilityChange(index, e.target.value)}
                  />
                  <Button
                    type='button'
                    color='danger'
                    outline
                    className='btn-icon'
                    size='sm'
                    onClick={() => handleRemoveResponsibility(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              <Button type='button' color='secondary' outline size='sm' onClick={handleAddResponsibility}>
                + Add Responsibility
              </Button>

              <hr className='my-2' />
              <h6 className='mb-1'>
                Requirements <span className='text-danger'>*</span>
              </h6>
              {requirements.map((requirement, index) => (
                <div key={index} className='d-flex align-items-center mb-1' style={{ gap: '0.5rem' }}>
                  <Input
                    placeholder='e.g. 3+ years of React experience'
                    value={requirement}
                    onChange={e => handleRequirementChange(index, e.target.value)}
                  />
                  <Button
                    type='button'
                    color='danger'
                    outline
                    className='btn-icon'
                    size='sm'
                    onClick={() => handleRemoveRequirement(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              <Button type='button' color='secondary' outline size='sm' onClick={handleAddRequirement}>
                + Add Requirement
              </Button>

              <hr className='my-2' />
              <h6 className='mb-1'>Publishing</h6>
              <div className='form-switch d-flex align-items-center'>
                <Input
                  type='switch'
                  id='is_active'
                  checked={isActive}
                  onChange={e => {
                    setIsActive(e.target.checked)
                    setExtraDirty(true)
                  }}
                  className='me-50'
                />
                <Label className='form-label mb-0' for='is_active'>
                  Publish immediately (Active)
                </Label>
              </div>
              <p className='text-muted small mb-0 mt-50'>Active jobs appear in the public API and on the website.</p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Form>
  )
}

export default JobListingForm