// ** React Imports
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ** Hooks
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'

// ** Third Party Components
import toast from 'react-hot-toast'
import { Editor } from '@veztraa/editor'

// ** Utils
import { uploadEditorImage } from '@utils'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, FormText } from 'reactstrap'

// ** Store & Actions
import { addEmailTemplate, updateEmailTemplate, getEmailTemplate } from '../store'

const defaultValues = { name: '', subject: '' }

const EmailTemplateForm = () => {
  // ** Hooks & Vars
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.emailTemplates)

  const [content, setContent] = useState('')
  // Tracks edits to content, which isn't registered with react-hook-form so
  // its own isDirty can't see it.
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
    if (isEdit) dispatch(getEmailTemplate(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedEmailTemplate && store.selectedEmailTemplate.id === Number(id)) {
      const template = store.selectedEmailTemplate
      reset({ name: template.name || '', subject: template.subject || '' })
      setContent(template.content || '')
    }
  }, [store.selectedEmailTemplate])

  const onSubmit = data => {
    if (data.name.length > 0) {
      const payload = { name: data.name, subject: data.subject, content }
      const action = isEdit ? updateEmailTemplate({ id: Number(id), ...payload }) : addEmailTemplate(payload)
      dispatch(action).then(() => {
        toast.success(isEdit ? 'Email template updated' : 'Email template added')
        navigate('/email-template')
      })
    } else {
      setError('name', { type: 'manual' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit Email Template' : 'Add New Email Template'}</CardTitle>
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
                  <Input id='name' placeholder='Welcome Email' invalid={errors.name && true} {...field} />
                )}
              />
              <FormText color='muted'>Internal label to find this template by - not shown to recipients.</FormText>
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='subject'>
                Subject
              </Label>
              <Controller
                name='subject'
                control={control}
                render={({ field }) => <Input id='subject' placeholder='Welcome to Veztraa!' {...field} />}
              />
              <FormText color='muted'>Pre-fills Compose's subject line when this template is loaded.</FormText>
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

export default EmailTemplateForm
