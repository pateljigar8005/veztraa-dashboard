import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import ImageUploadField from '../../shared/ImageUploadField'
import { resolveAvatarUrl } from '@utils'
import HistoryModal from '../../activity-log/HistoryModal'
import { addTeamMember, updateTeamMember, getTeamMember, uploadTeamMemberPhoto } from '../store'

const defaultValues = {
  full_name: '',
  role_title: '',
  introduction: ''
}

const TeamMemberForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.teamMembers)

  const [isActive, setIsActive] = useState(true)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [extraDirty, setExtraDirty] = useState(false)

  const {
    control,
    reset,
    watch,
    setError,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty || extraDirty)

  const introduction = watch('introduction')

  useEffect(() => {
    if (isEdit) dispatch(getTeamMember(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedTeamMember && store.selectedTeamMember.id === Number(id)) {
      const member = store.selectedTeamMember
      reset({
        full_name: member.full_name || '',
        role_title: member.role_title || '',
        introduction: member.introduction || ''
      })
      setIsActive(member.is_active !== false)
      setPhotoPreview(resolveAvatarUrl(member.photo))
    }
  }, [store.selectedTeamMember])

  const handlePhotoChange = file => {
    setPhotoPreview(URL.createObjectURL(file))
    if (isEdit) {
      dispatch(uploadTeamMemberPhoto({ id: Number(id), file })).then(() => toast.success('Photo updated'))
    } else {
      setPhotoFile(file)
      setExtraDirty(true)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    setPhotoFile(null)
    if (isEdit) {
      dispatch(updateTeamMember({ id: Number(id), photo: null })).then(() => toast.success('Photo removed'))
    }
  }

  const onSubmit = data => {
    if (!data.full_name || !data.role_title) {
      if (!data.full_name) setError('full_name', { type: 'manual' })
      if (!data.role_title) setError('role_title', { type: 'manual' })
      return
    }

    const payload = {
      full_name: data.full_name,
      role_title: data.role_title,
      introduction: data.introduction,
      is_active: isActive
    }

    const action = isEdit ? updateTeamMember({ id: Number(id), ...payload }) : addTeamMember(payload)
    dispatch(action).then(result => {
      toast.success(isEdit ? 'Team member updated' : 'Team member added')
      if (!isEdit && photoFile) {
        dispatch(uploadTeamMemberPhoto({ id: result.payload.id, file: photoFile })).finally(() => navigate('/team-member'))
      } else {
        navigate('/team-member')
      }
    })
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Col lg='12'>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>{isEdit ? 'Edit Team Member' : 'Add Team Member'}</CardTitle>
              {isEdit && <HistoryModal entityType='team_member' entityId={Number(id)} buttonId='team-member-history-btn' />}
            </CardHeader>
            <CardBody>
              <Row>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='full_name'>
                    Full Name <span className='text-danger'>*</span>
                  </Label>
                  <Controller
                    name='full_name'
                    control={control}
                    render={({ field }) => (
                      <Input id='full_name' placeholder='e.g. Jigar Patel' invalid={errors.full_name && true} {...field} />
                    )}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='role_title'>
                    Role / Title <span className='text-danger'>*</span>
                  </Label>
                  <Controller
                    name='role_title'
                    control={control}
                    render={({ field }) => (
                      <Input id='role_title' placeholder='e.g. Co-Founder & CEO' invalid={errors.role_title && true} {...field} />
                    )}
                  />
                </Col>
                <Col md={12}>
                  <Label className='form-label' for='introduction'>
                    Introduction (optional)
                  </Label>
                  <Controller
                    name='introduction'
                    control={control}
                    render={({ field }) => (
                      <Input
                        type='textarea'
                        rows='3'
                        id='introduction'
                        maxLength={1000}
                        placeholder='A short bio or introduction...'
                        {...field}
                      />
                    )}
                  />
                  <p className='text-muted small mb-0 mt-25 text-end'>{(introduction || '').length} / 1000</p>
                </Col>
              </Row>

              <hr className='my-2' />
              <h6 className='mb-1'>Profile Picture</h6>
              <ImageUploadField
                preview={photoPreview}
                onFileSelect={handlePhotoChange}
                onRemove={handleRemovePhoto}
                helperText='JPG, PNG or WebP — max 2MB.'
              />

              <hr className='my-2' />
              <h6 className='mb-1'>Visibility</h6>
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
                  Active (visible on website)
                </Label>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Form>
  )
}

export default TeamMemberForm