import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import { Editor } from '@veztraa/editor'
import { uploadEditorImage } from '@utils'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { addTermsTemplate, updateTermsTemplate, getTermsTemplate } from '../store'

const defaultValues = { name: '' }

const TermsTemplateForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.termsTemplates)

  const [content, setContent] = useState('')
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
    if (isEdit) dispatch(getTermsTemplate(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedTermsTemplate && store.selectedTermsTemplate.id === Number(id)) {
      const template = store.selectedTermsTemplate
      reset({ name: template.name || '' })
      setContent(template.content || '')
    }
  }, [store.selectedTermsTemplate])

  const onSubmit = data => {
    if (data.name.length > 0) {
      const payload = { name: data.name, content }
      const action = isEdit ? updateTermsTemplate({ id: Number(id), ...payload }) : addTermsTemplate(payload)
      dispatch(action).then(() => {
        toast.success(isEdit ? 'Terms & Conditions updated' : 'Terms & Conditions added')
        navigate('/terms-template')
      })
    } else {
      setError('name', { type: 'manual' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Terms & Conditions' : 'Add New Terms & Conditions'}</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='name'>
                Template Name <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <Input id='name' placeholder='Standard Terms' invalid={errors.name && true} {...field} />
                )}
              />
            </Col>
            <Col md={12}>
              <Label className='form-label'>Content</Label>
              <Editor
                value={content}
                onChange={value => {
                  setContent(value)
                  setExtraDirty(true)
                }}
                height={500}
                onImageUpload={uploadEditorImage}
              />
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default TermsTemplateForm