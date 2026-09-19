import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Row,
  Col,
  Form,
  Label,
  Input,
  InputGroup,
  InputGroupText,
  Button
} from 'reactstrap'
import { X } from 'react-feather'
import ImageUploadField from '../../shared/ImageUploadField'
import { resolveAvatarUrl } from '@utils'
import { addCaseStudy, updateCaseStudy, getCaseStudy, getAllData, uploadCaseStudyCoverImage } from '../store'

const slugify = value =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const defaultValues = {
  title: '',
  slug: '',
  category: '',
  short_description: '',
  project_summary: '',
  business_needs: '',
  challenges: '',
  proposed_solution: '',
  technologies: ''
}

const CaseStudyForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.caseStudies)

  const [isActive, setIsActive] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [objectives, setObjectives] = useState([''])
  const [relatedIds, setRelatedIds] = useState([])
  const [relatedSearch, setRelatedSearch] = useState('')
  const [extraDirty, setExtraDirty] = useState(false)

  const {
    control,
    reset,
    watch,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty || extraDirty)

  const title = watch('title')

  useEffect(() => {
    dispatch(getAllData())
  }, [])

  useEffect(() => {
    if (!isEdit && !slugManuallyEdited) {
      setValue('slug', slugify(title || ''))
    }
  }, [title])

  useEffect(() => {
    if (isEdit) dispatch(getCaseStudy(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedCaseStudy && store.selectedCaseStudy.id === Number(id)) {
      const cs = store.selectedCaseStudy
      reset({
        title: cs.title || '',
        slug: cs.slug || '',
        category: cs.category || '',
        short_description: cs.short_description || '',
        project_summary: cs.project_summary || '',
        business_needs: cs.business_needs || '',
        challenges: cs.challenges || '',
        proposed_solution: cs.proposed_solution || '',
        technologies: cs.technologies || ''
      })
      setIsActive(cs.is_active !== false)
      setIsFeatured(cs.is_featured === true)
      setImagePreview(resolveAvatarUrl(cs.cover_image))
      setObjectives(cs.objectives && cs.objectives.length > 0 ? cs.objectives : [''])
      setRelatedIds(cs.related_case_study_ids || [])
    }
  }, [store.selectedCaseStudy])

  const handleObjectiveChange = (index, value) => {
    setObjectives(prev => prev.map((o, i) => (i === index ? value : o)))
    setExtraDirty(true)
  }

  const handleAddObjective = () => {
    setObjectives(prev => [...prev, ''])
    setExtraDirty(true)
  }

  const handleRemoveObjective = index => {
    setObjectives(prev => prev.filter((_, i) => i !== index))
    setExtraDirty(true)
  }

  const toggleRelated = relatedId => {
    setRelatedIds(prev => (prev.includes(relatedId) ? prev.filter(x => x !== relatedId) : [...prev, relatedId]))
    setExtraDirty(true)
  }

  const filteredRelated = (store.allData || []).filter(
    cs => cs.id !== Number(id) && cs.title.toLowerCase().includes(relatedSearch.toLowerCase())
  )

  const handleImageChange = file => {
    setImagePreview(URL.createObjectURL(file))
    if (isEdit) {
      dispatch(uploadCaseStudyCoverImage({ id: Number(id), file })).then(() => toast.success('Cover image updated'))
    } else {
      setImageFile(file)
      setExtraDirty(true)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setImageFile(null)
    if (isEdit) {
      dispatch(updateCaseStudy({ id: Number(id), cover_image: null })).then(() => toast.success('Cover image removed'))
    }
  }

  const onSubmit = data => {
    if (!data.title) {
      setError('title', { type: 'manual' })
      return
    }

    const payload = {
      title: data.title,
      slug: data.slug || slugify(data.title),
      category: data.category,
      short_description: data.short_description,
      project_summary: data.project_summary,
      business_needs: data.business_needs,
      challenges: data.challenges,
      proposed_solution: data.proposed_solution,
      objectives: objectives.map(o => o.trim()).filter(Boolean),
      technologies: data.technologies,
      related_case_study_ids: relatedIds,
      is_active: isActive,
      is_featured: isFeatured
    }

    const action = isEdit ? updateCaseStudy({ id: Number(id), ...payload }) : addCaseStudy(payload)
    dispatch(action).then(result => {
      if (result.error) return
      toast.success(isEdit ? 'Case study updated' : 'Case study added')
      if (!isEdit && imageFile) {
        dispatch(uploadCaseStudyCoverImage({ id: result.payload.id, file: imageFile })).finally(() =>
          navigate('/case-study')
        )
      } else {
        navigate('/case-study')
      }
    })
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Col lg='12'>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>{isEdit ? 'Edit Case Study' : 'Add Case Study'}</CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='title'>
                    Title <span className='text-danger'>*</span>
                  </Label>
                  <Controller
                    name='title'
                    control={control}
                    render={({ field }) => (
                      <Input id='title' placeholder='e.g. Adaptive Learning Algorithms' invalid={errors.title && true} {...field} />
                    )}
                  />
                </Col>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='slug'>
                    Slug <span className='text-danger'>*</span>
                  </Label>
                  <InputGroup>
                    <InputGroupText>/case-studies/</InputGroupText>
                    <Controller
                      name='slug'
                      control={control}
                      render={({ field }) => (
                        <Input
                          id='slug'
                          placeholder='adaptive-learning-algorithms'
                          invalid={errors.slug && true}
                          {...field}
                          onChange={e => {
                            setSlugManuallyEdited(true)
                            field.onChange(slugify(e.target.value))
                          }}
                        />
                      )}
                    />
                  </InputGroup>
                  <p className='text-muted small mb-0 mt-50'>Lowercase letters, numbers, and hyphens only. Used in the page URL.</p>
                </Col>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='category'>
                    Category
                  </Label>
                  <Controller
                    name='category'
                    control={control}
                    render={({ field }) => <Input id='category' placeholder='e.g. Education, Healthcare, Fintech' {...field} />}
                  />
                </Col>
                <Col md={12}>
                  <Label className='form-label' for='short_description'>
                    Short Description
                  </Label>
                  <Controller
                    name='short_description'
                    control={control}
                    render={({ field }) => (
                      <Input type='textarea' rows='2' id='short_description' placeholder='One-liner tagline shown on listing cards...' {...field} />
                    )}
                  />
                </Col>
              </Row>

              <hr className='my-2' />
              <h6 className='mb-1'>Case Study Details</h6>
              <Row>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='project_summary'>
                    Project Summary
                  </Label>
                  <Controller
                    name='project_summary'
                    control={control}
                    render={({ field }) => (
                      <Input type='textarea' rows='3' id='project_summary' placeholder='Describe the overall project goals, scope, and what was delivered...' {...field} />
                    )}
                  />
                </Col>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='business_needs'>
                    Business Needs
                  </Label>
                  <Controller
                    name='business_needs'
                    control={control}
                    render={({ field }) => (
                      <Input type='textarea' rows='3' id='business_needs' placeholder='What business problem or need did the client want to address?' {...field} />
                    )}
                  />
                </Col>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='challenges'>
                    Challenges
                  </Label>
                  <Controller
                    name='challenges'
                    control={control}
                    render={({ field }) => (
                      <Input type='textarea' rows='3' id='challenges' placeholder='Key technical or strategic challenges encountered...' {...field} />
                    )}
                  />
                </Col>
                <Col md={12}>
                  <Label className='form-label' for='proposed_solution'>
                    Proposed Solution
                  </Label>
                  <Controller
                    name='proposed_solution'
                    control={control}
                    render={({ field }) => (
                      <Input type='textarea' rows='3' id='proposed_solution' placeholder='The solution designed and implemented to overcome those challenges...' {...field} />
                    )}
                  />
                </Col>
              </Row>

              <hr className='my-2' />
              <h6 className='mb-1'>Objectives Achieved</h6>
              {objectives.map((objective, index) => (
                <div key={index} className='d-flex align-items-center mb-1' style={{ gap: '0.5rem' }}>
                  <Input
                    placeholder='e.g. Student participation up by 48%'
                    value={objective}
                    onChange={e => handleObjectiveChange(index, e.target.value)}
                  />
                  <Button
                    type='button'
                    color='flat-danger'
                    className='btn-icon'
                    size='sm'
                    onClick={() => handleRemoveObjective(index)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              <Button type='button' color='secondary' outline size='sm' onClick={handleAddObjective}>
                + Add Objective
              </Button>
              <p className='text-muted small mb-0 mt-50'>List each key result or milestone achieved.</p>

              <hr className='my-2' />
              <h6 className='mb-1'>Technologies Used</h6>
              <Controller
                name='technologies'
                control={control}
                render={({ field }) => <Input id='technologies' placeholder='e.g. Docker, GraphQL, Firebase, Node.js' {...field} />}
              />
              <p className='text-muted small mb-0 mt-50'>Separate technologies with commas.</p>

              <hr className='my-2' />
              <h6 className='mb-1'>Cover Image</h6>
              <ImageUploadField
                preview={imagePreview}
                onFileSelect={handleImageChange}
                onRemove={handleRemoveImage}
                helperText='JPG, PNG or WebP — max 2MB.'
              />

              <hr className='my-2' />
              <h6 className='mb-1'>Visibility</h6>
              <div className='form-switch d-flex align-items-center mb-1'>
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
                  Active (visible on website)
                </Label>
              </div>
              <div className='form-switch d-flex align-items-center'>
                <Input
                  type='switch'
                  id='is_featured'
                  checked={isFeatured}
                  onChange={e => {
                    setIsFeatured(e.target.checked)
                    setExtraDirty(true)
                  }}
                  className='me-50'
                />
                <Label className='form-label mb-0' for='is_featured'>
                  Featured
                </Label>
              </div>

              <hr className='my-2' />
              <h6 className='mb-1'>Related Case Studies</h6>
              <Input
                className='mb-1'
                placeholder='Search...'
                value={relatedSearch}
                onChange={e => setRelatedSearch(e.target.value)}
              />
              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {filteredRelated.map(cs => (
                  <div key={cs.id} className='d-flex align-items-center justify-content-between mb-50'>
                    <div className='form-check'>
                      <Input
                        type='checkbox'
                        id={`related-${cs.id}`}
                        checked={relatedIds.includes(cs.id)}
                        onChange={() => toggleRelated(cs.id)}
                      />
                      <Label className='form-check-label' for={`related-${cs.id}`}>
                        {cs.title}
                      </Label>
                    </div>
                    {cs.category && <small className='text-muted text-truncate ms-50'>{cs.category}</small>}
                  </div>
                ))}
                {filteredRelated.length === 0 && <p className='text-muted small mb-0'>No case studies found.</p>}
              </div>
              <p className='text-muted small mb-0 mt-50'>Select case studies to show as related.</p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Form>
  )
}

export default CaseStudyForm