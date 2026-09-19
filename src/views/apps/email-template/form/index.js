import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import axios from 'axios'
import Select from 'react-select'
import toast from 'react-hot-toast'
import { Editor } from '@veztraa/editor'
import { uploadEditorImage, selectThemeColors } from '@utils'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, FormText } from 'reactstrap'
import { addEmailTemplate, updateEmailTemplate, getEmailTemplate } from '../store'

const defaultValues = { name: '', subject: '' }

const EmailTemplateForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.emailTemplates)

  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [roleOptions, setRoleOptions] = useState([])
  const [visibleRoleIds, setVisibleRoleIds] = useState([])
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
    axios.get('/roles').then(response => {
      setRoleOptions((response.data.data || []).map(r => ({ value: r.id, label: r.name })))
    })
  }, [])

  useEffect(() => {
    if (isEdit) dispatch(getEmailTemplate(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedEmailTemplate && store.selectedEmailTemplate.id === Number(id)) {
      const template = store.selectedEmailTemplate
      reset({ name: template.name || '', subject: template.subject || '' })
      setContent(template.content || '')
      setIsActive(template.is_active !== false)
      setVisibleRoleIds(template.visible_role_ids || [])
    }
  }, [store.selectedEmailTemplate])

  const onSubmit = data => {
    if (data.name.length > 0) {
      const payload = {
        name: data.name,
        subject: data.subject,
        content,
        is_active: isActive,
        visible_role_ids: visibleRoleIds
      }
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
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='visible_role_ids'>
                Visible To
              </Label>
              <Select
                inputId='visible_role_ids'
                isMulti
                isClearable
                className='react-select'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={roleOptions}
                value={roleOptions.filter(o => visibleRoleIds.includes(o.value))}
                onChange={options => {
                  setVisibleRoleIds((options || []).map(o => o.value))
                  setExtraDirty(true)
                }}
                placeholder='Everyone (leave blank)'
              />
              <FormText color='muted'>
                Restricts which roles see this in Compose's template picker. Leave blank for everyone.
              </FormText>
            </Col>
            <Col md={6} className='mb-1 d-flex align-items-end'>
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
                  Active (usable in Compose)
                </Label>
              </div>
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