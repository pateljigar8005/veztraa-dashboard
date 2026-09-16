// ** React Imports
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ** Hooks
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, FormText } from 'reactstrap'

// ** Store & Actions
import { addUser, updateUser, getUser, uploadAvatar } from '../store'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Utils
import { resolveAvatarUrl } from '@utils'

const defaultValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  email_login: '',
  email_login_password: ''
}

const UserForm = () => {
  // ** Hooks & Vars
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.users)

  // ** States
  const [roles, setRoles] = useState([])
  const [roleId, setRoleId] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  // Tracks edits to the state above (role, avatar), none of which is
  // registered with react-hook-form, so its own isDirty can't see them.
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

  const fullName = `${watch('first_name')} ${watch('last_name')}`.trim()

  // ** Fetch roles for the dropdown
  useEffect(() => {
    axios.get('/roles').then(response => {
      const data = response.data.data
      setRoles(data)
      if (!isEdit && data.length) setRoleId(String(data[0].id))
    })
  }, [])

  // ** Fetch the user being edited
  useEffect(() => {
    if (isEdit) dispatch(getUser(id))
  }, [id])

  // ** Populate the form once the user loads
  useEffect(() => {
    if (isEdit && store.selectedUser && store.selectedUser.id === Number(id)) {
      const user = store.selectedUser
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        email_login: user.email_login || '',
        email_login_password: ''
      })
      if (user.role_id) setRoleId(String(user.role_id))
      setAvatarPreview(resolveAvatarUrl(user.avatar))
    }
  }, [store.selectedUser])

  // ** Edit mode: upload immediately since the user already has an id.
  // Add mode: just stage the file - it's uploaded right after the new
  // user is created, once a real id exists to attach it to.
  const handleAvatarChange = e => {
    const file = e.target.files[0]
    if (!file) return

    setAvatarPreview(URL.createObjectURL(file))
    if (isEdit) {
      dispatch(uploadAvatar({ id: Number(id), file })).then(() => toast.success('Avatar updated'))
    } else {
      setAvatarFile(file)
      setExtraDirty(true)
    }
  }

  const checkIsValid = data => {
    const requiredOk = ['first_name', 'last_name', 'email', 'phone'].every(key => data[key].length > 0)
    const passwordOk = isEdit || data.password.length > 0
    return requiredOk && passwordOk
  }

  const onSubmit = data => {
    if (checkIsValid(data) && roleId) {
      const payload = {
        role_id: Number(roleId),
        email: data.email,
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name,
        email_login: data.email_login
      }
      if (data.password.length) payload.password = data.password
      if (data.email_login_password.length) payload.email_login_password = data.email_login_password

      const action = isEdit ? updateUser({ id: Number(id), ...payload }) : addUser(payload)
      dispatch(action).then(result => {
        toast.success(isEdit ? 'User updated' : 'User added')
        if (!isEdit && avatarFile) {
          dispatch(uploadAvatar({ id: result.payload.id, file: avatarFile })).finally(() => navigate('/user'))
        } else {
          navigate('/user')
        }
      })
    } else {
      const optionalKeys = ['email_login', 'email_login_password']
      for (const key in data) {
        if (key === 'password' && isEdit) continue
        if (optionalKeys.includes(key)) continue
        if (data[key].length === 0) {
          setError(key, { type: 'manual' })
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit User' : 'Add New User'}</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md={12} className='mb-2 d-flex align-items-center'>
              {avatarPreview ? (
                <Avatar img={avatarPreview} imgHeight='80' imgWidth='80' className='me-1' />
              ) : (
                <Avatar
                  initials
                  size='xl'
                  color='light-primary'
                  content={fullName || 'New User'}
                  className='me-1'
                />
              )}
              <div>
                <Label className='btn btn-primary btn-sm mb-0' for='avatar-upload'>
                  Upload Photo
                </Label>
                <Input
                  type='file'
                  id='avatar-upload'
                  accept='.jpg,.jpeg,.png,.gif,.webp'
                  className='d-none'
                  onChange={handleAvatarChange}
                />
                <p className='text-muted small mb-0 mt-50'>JPG, PNG, GIF or WEBP. Max 2MB.</p>
              </div>
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='first_name'>
                First Name <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='first_name'
                control={control}
                render={({ field }) => (
                  <Input id='first_name' placeholder='John' invalid={errors.first_name && true} {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='last_name'>
                Last Name <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='last_name'
                control={control}
                render={({ field }) => (
                  <Input id='last_name' placeholder='Doe' invalid={errors.last_name && true} {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='email'>
                Email <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='email'
                control={control}
                render={({ field }) => (
                  <Input
                    type='email'
                    id='email'
                    placeholder='john.doe@example.com'
                    invalid={errors.email && true}
                    {...field}
                  />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='phone'>
                Phone <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='phone'
                control={control}
                render={({ field }) => (
                  <Input id='phone' placeholder='(397) 294-5153' invalid={errors.phone && true} {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='password'>
                Password {!isEdit && <span className='text-danger'>*</span>}
              </Label>
              <Controller
                name='password'
                control={control}
                render={({ field }) => (
                  <Input type='password' id='password' invalid={errors.password && true} {...field} />
                )}
              />
              <FormText color='muted'>
                {isEdit ? 'Leave blank to keep the current password' : 'Minimum 6 characters'}
              </FormText>
            </Col>
            <Col md={6}>
              <Label className='form-label' for='user-role'>
                User Role
              </Label>
              <Input
                type='select'
                id='user-role'
                value={roleId}
                onChange={e => {
                  setRoleId(e.target.value)
                  setExtraDirty(true)
                }}
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Input>
            </Col>
          </Row>

          <h5 className='mb-1 mt-2'>Email Settings</h5>
          <p className='text-muted small'>Login details for this user's own email account.</p>
          <Row>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='email_login'>
                Email
              </Label>
              <Controller
                name='email_login'
                control={control}
                render={({ field }) => (
                  <Input type='email' id='email_login' placeholder='john.doe@example.com' {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='email_login_password'>
                Password
              </Label>
              <Controller
                name='email_login_password'
                control={control}
                render={({ field }) => <Input type='password' id='email_login_password' {...field} />}
              />
              <FormText color='muted'>Leave blank to keep the current email password</FormText>
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default UserForm
