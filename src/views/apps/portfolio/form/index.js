// ** React Imports
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ** Hooks
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'

// ** Third Party Components
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'

// ** Custom Components
import ImageUploadField from '../../shared/ImageUploadField'

// ** Utils
import { resolveAvatarUrl } from '@utils'

// ** Store & Actions
import { addPortfolioItem, updatePortfolioItem, getPortfolioItem, uploadPortfolioItemImage } from '../store'

const defaultValues = {
  title: '',
  category: '',
  client_name: '',
  description: '',
  completion_date: '',
  project_url: '',
  tags: ''
}

const PortfolioForm = () => {
  // ** Hooks & Vars
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.portfolioItems)

  const [isActive, setIsActive] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  // Tracks edits to the state above (visibility toggles, image), none of
  // which is registered with react-hook-form, so its own isDirty can't see them.
  const [extraDirty, setExtraDirty] = useState(false)

  const {
    control,
    reset,
    setError,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty || extraDirty)

  // ** Fetch the portfolio item being edited
  useEffect(() => {
    if (isEdit) dispatch(getPortfolioItem(id))
  }, [id])

  // ** Populate the form once the portfolio item loads
  useEffect(() => {
    if (isEdit && store.selectedPortfolioItem && store.selectedPortfolioItem.id === Number(id)) {
      const item = store.selectedPortfolioItem
      reset({
        title: item.title || '',
        category: item.category || '',
        client_name: item.client_name || '',
        description: item.description || '',
        completion_date: item.completion_date || '',
        project_url: item.project_url || '',
        tags: item.tags || ''
      })
      setIsActive(item.is_active !== false)
      setIsFeatured(item.is_featured === true)
      setImagePreview(resolveAvatarUrl(item.image))
    }
  }, [store.selectedPortfolioItem])

  // ** Edit mode: upload immediately since the item already has an id.
  // Add mode: just stage the file - it's uploaded right after the new
  // item is created, once a real id exists to attach it to.
  const handleImageChange = file => {
    setImagePreview(URL.createObjectURL(file))
    if (isEdit) {
      dispatch(uploadPortfolioItemImage({ id: Number(id), file })).then(() => toast.success('Image updated'))
    } else {
      setImageFile(file)
      setExtraDirty(true)
    }
  }

  // ** Add mode: nothing saved yet, just clear the staged file. Edit mode:
  // the image is already persisted, so clearing it is a real update.
  const handleRemoveImage = () => {
    setImagePreview(null)
    setImageFile(null)
    if (isEdit) {
      dispatch(updatePortfolioItem({ id: Number(id), image: null })).then(() => toast.success('Image removed'))
    }
  }

  const onSubmit = data => {
    if (!data.title) {
      setError('title', { type: 'manual' })
      return
    }

    const payload = {
      title: data.title,
      category: data.category,
      client_name: data.client_name,
      description: data.description,
      completion_date: data.completion_date || null,
      project_url: data.project_url,
      tags: data.tags,
      is_active: isActive,
      is_featured: isFeatured
    }

    const action = isEdit ? updatePortfolioItem({ id: Number(id), ...payload }) : addPortfolioItem(payload)
    dispatch(action).then(result => {
      toast.success(isEdit ? 'Portfolio item updated' : 'Portfolio item added')
      if (!isEdit && imageFile) {
        dispatch(uploadPortfolioItemImage({ id: result.payload.id, file: imageFile })).finally(() => navigate('/portfolio'))
      } else {
        navigate('/portfolio')
      }
    })
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Col lg='12'>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>{isEdit ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</CardTitle>
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
                      <Input id='title' placeholder='e.g. E-commerce Platform Redesign' invalid={errors.title && true} {...field} />
                    )}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='category'>
                    Category
                  </Label>
                  <Controller
                    name='category'
                    control={control}
                    render={({ field }) => <Input id='category' placeholder='e.g. Web Development' {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='client_name'>
                    Client Name
                  </Label>
                  <Controller
                    name='client_name'
                    control={control}
                    render={({ field }) => <Input id='client_name' placeholder='e.g. Acme Corp' {...field} />}
                  />
                </Col>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='description'>
                    Description
                  </Label>
                  <Controller
                    name='description'
                    control={control}
                    render={({ field }) => <Input type='textarea' rows='4' id='description' placeholder='Describe the project...' {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='completion_date'>
                    Completion Date
                  </Label>
                  <Controller
                    name='completion_date'
                    control={control}
                    render={({ field }) => <Input type='date' id='completion_date' {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='project_url'>
                    Project / Live URL
                  </Label>
                  <Controller
                    name='project_url'
                    control={control}
                    render={({ field }) => <Input id='project_url' placeholder='https://example.com' {...field} />}
                  />
                </Col>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='tags'>
                    Tags
                  </Label>
                  <Controller
                    name='tags'
                    control={control}
                    render={({ field }) => <Input id='tags' placeholder='e.g. React, Node.js, MySQL' {...field} />}
                  />
                  <p className='text-muted small mb-0 mt-50'>Separate tags with commas.</p>
                </Col>
              </Row>

              <hr className='my-2' />
              <h6 className='mb-1'>Project Image</h6>
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
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Form>
  )
}

export default PortfolioForm
