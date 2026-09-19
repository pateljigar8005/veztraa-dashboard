import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, FormText, InputGroup, InputGroupText } from 'reactstrap'
import { addUser, updateUser, getUser, uploadAvatar } from '../store'
import InputPasswordToggle from '@components/input-password-toggle'
import ImageUploadField from '../../shared/ImageUploadField'
import { Editor } from '@veztraa/editor'
import { getUserData, resolveAvatarUrl, uploadEditorImage } from '@utils'

const PASSWORD_PLACEHOLDER = '••••••••'

const defaultValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  email_login: '',
  email_login_password: '',
  email_signature: ''
}

const UserForm = () => {
  const location = useLocation()
  const selfMode = location.pathname === '/account-settings'
  const { id: routeId } = useParams()
  const id = selfMode ? getUserData()?.id : routeId
  const isEdit = selfMode ? true : Boolean(routeId)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.users)

  const [roles, setRoles] = useState([])
  const [roleId, setRoleId] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [autoAppendSignature, setAutoAppendSignature] = useState(true)
  const [mailDomain, setMailDomain] = useState('')
  const [mailDomainLoaded, setMailDomainLoaded] = useState(false)
  const [emailUsernameMode, setEmailUsernameMode] = useState(false)
  const [samePasswordAsLogin, setSamePasswordAsLogin] = useState(true)
  const [extraDirty, setExtraDirty] = useState(false)

  const {
    control,
    reset,
    setError,
    handleSubmit,
    watch,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  const watchedPassword = watch('password')

  useUnsavedChangesGuard(isDirty || extraDirty)

  useEffect(() => {
    axios.get('/roles').then(response => {
      const data = response.data.data
      setRoles(data)
      if (!isEdit && data.length) setRoleId(String(data[0].id))
    })
  }, [])

  useEffect(() => {
    axios.get('/company').then(response => {
      setMailDomain(response.data.data.mail_domain || '')
      setMailDomainLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (isEdit) dispatch(getUser(id))
  }, [id])

  useEffect(() => {
    if (mailDomainLoaded && !isEdit) setEmailUsernameMode(Boolean(mailDomain))
  }, [mailDomainLoaded, mailDomain, isEdit])

  useEffect(() => {
    if (isEdit && store.selectedUser && store.selectedUser.id === Number(id) && mailDomainLoaded) {
      const user = store.selectedUser
      const email = user.email || ''
      const suffix = mailDomain ? `@${mailDomain}` : ''
      const usernameMode = Boolean(mailDomain) && email.endsWith(suffix)
      setEmailUsernameMode(usernameMode)
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: usernameMode ? email.slice(0, -suffix.length) : email,
        phone: user.phone || '',
        password: PASSWORD_PLACEHOLDER,
        email_login: user.email_login || '',
        email_login_password: user.email_login_password || '',
        email_signature: user.email_signature || ''
      })
      setAutoAppendSignature(user.email_signature_auto_append !== false)
      setSamePasswordAsLogin(user.email_login_password_synced !== false)
      if (user.role_id) setRoleId(String(user.role_id))
      setAvatarPreview(resolveAvatarUrl(user.avatar))
    }
  }, [store.selectedUser, mailDomainLoaded, mailDomain])

  const handleAvatarChange = file => {
    setAvatarPreview(URL.createObjectURL(file))
    if (isEdit) {
      dispatch(uploadAvatar({ id: Number(id), file })).then(() => toast.success('Avatar updated'))
    } else {
      setAvatarFile(file)
      setExtraDirty(true)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    setAvatarFile(null)
    if (isEdit) {
      dispatch(updateUser({ id: Number(id), avatar: null }))
        .unwrap()
        .then(() => toast.success('Avatar removed'))
        .catch(err => toast.error(err?.message || 'Failed to remove avatar'))
    }
  }

  const checkIsValid = data => {
    const requiredOk = ['first_name', 'last_name', 'email', 'phone'].every(key => data[key].length > 0)
    const passwordOk = isEdit || (data.password.length > 0 && data.password !== PASSWORD_PLACEHOLDER)
    return requiredOk && passwordOk
  }

  const onSubmit = data => {
    if (checkIsValid(data) && roleId) {
      const payload = {
        role_id: Number(roleId),
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name,
        email_signature: data.email_signature,
        email_signature_auto_append: autoAppendSignature,
        email_login_password_synced: samePasswordAsLogin
      }
      if (emailUsernameMode) {
        payload.email = `${data.email}@${mailDomain}`
        payload.email_login_username = data.email
      } else {
        payload.email = data.email
        payload.email_login = data.email_login
      }
      const newLoginPassword = data.password.length && data.password !== PASSWORD_PLACEHOLDER ? data.password : null
      if (newLoginPassword) payload.password = newLoginPassword

      if (samePasswordAsLogin) {
        if (newLoginPassword) payload.email_login_password = newLoginPassword
      } else if (data.email_login_password.length) {
        payload.email_login_password = data.email_login_password
      }

      const action = isEdit ? updateUser({ id: Number(id), ...payload }) : addUser(payload)
      dispatch(action)
        .unwrap()
        .then(result => {
          toast.success(selfMode ? 'Account updated' : isEdit ? 'User updated' : 'User added')
          if (selfMode) {
            reset({
              ...data,
              password: PASSWORD_PLACEHOLDER,
              email_login_password: data.email_login_password ? PASSWORD_PLACEHOLDER : ''
            })
            setExtraDirty(false)
            return
          }
          if (!isEdit && avatarFile) {
            dispatch(uploadAvatar({ id: result.id, file: avatarFile })).finally(() => navigate('/user'))
          } else {
            navigate('/user')
          }
        })
        .catch(err => {
          toast.error(err?.message || (isEdit ? 'Failed to update user' : 'Failed to add user'))
        })
    } else {
      const optionalKeys = ['email_login', 'email_login_password', 'email_signature']
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
        <CardTitle tag='h4'>{selfMode ? 'Account Settings' : isEdit ? 'Edit User' : 'Add New User'}</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md={12} className='mb-2'>
              <Label className='form-label d-block'>Profile Picture</Label>
              <ImageUploadField
                preview={avatarPreview}
                onFileSelect={handleAvatarChange}
                onRemove={handleRemoveAvatar}
                helperText='JPG, PNG, GIF or WebP — max 2MB.'
              />
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
              {emailUsernameMode ? (
                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => (
                    <InputGroup>
                      <Input id='email' placeholder='dhruvit' invalid={errors.email && true} disabled={selfMode} {...field} />
                      <InputGroupText>{`@${mailDomain}`}</InputGroupText>
                    </InputGroup>
                  )}
                />
              ) : (
                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => (
                    <Input
                      type='email'
                      id='email'
                      placeholder='john.doe@example.com'
                      invalid={errors.email && true}
                      disabled={selfMode}
                      {...field}
                    />
                  )}
                />
              )}
              {selfMode && <FormText color='muted'>Contact an admin to change your login email.</FormText>}
              {!selfMode && emailUsernameMode && (
                <FormText color='muted'>Also this user's company mailbox - creates it on save if it doesn't exist yet.</FormText>
              )}
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
            {
                                                                             }
            {!selfMode && (
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='password'>
                  Password {!isEdit && <span className='text-danger'>*</span>}
                </Label>
                <Controller
                  name='password'
                  control={control}
                  render={({ field }) => (
                    <InputPasswordToggle
                      id='password'
                      invalid={errors.password && true}
                      {...field}
                      onFocus={e => {
                        if (isEdit) e.target.select()
                      }}
                    />
                  )}
                />
                <FormText color='muted'>
                  {isEdit
                    ? 'Leave as-is to keep the current password - the eye icon reveals what you type, not the existing one'
                    : 'Minimum 6 characters'}
                </FormText>
              </Col>
            )}
            {!selfMode && (
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
            )}
          </Row>

          <h5 className='mb-1 mt-2'>Email Settings</h5>
          <p className='text-muted small'>
            {selfMode
              ? 'Your email signature and how Compose uses it.'
              : "Login details for this user's own email account."}
          </p>
          {
                                          }
          {!selfMode && (
            <div className='d-flex align-items-center mb-1' style={{ gap: '0.5rem' }}>
              <div className='form-switch'>
                <Input
                  type='switch'
                  id='same_password_as_login'
                  checked={samePasswordAsLogin}
                  onChange={e => {
                    setSamePasswordAsLogin(e.target.checked)
                    setExtraDirty(true)
                  }}
                />
              </div>
              <Label className='form-label mb-0' htmlFor='same_password_as_login'>
                Use the same password for the company mailbox as the login password
              </Label>
            </div>
          )}
          <Row>
            {
                                                                }
            {!selfMode && !emailUsernameMode && (
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='email_login'>
                  {mailDomain ? 'Company Mailbox' : 'Email'}
                </Label>
                <Controller
                  name='email_login'
                  control={control}
                  render={({ field }) => (
                    <Input type='email' id='email_login' placeholder='john.doe@example.com' {...field} />
                  )}
                />
                {mailDomain && (
                  <FormText color='muted'>Leave blank if this user doesn't need a company mailbox.</FormText>
                )}
              </Col>
            )}
            {!selfMode && (
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='email_login_password'>
                  {emailUsernameMode ? 'Mailbox Password' : 'Password'}
                </Label>
                {samePasswordAsLogin ? (
                  <InputPasswordToggle
                    id='email_login_password'
                    value={watchedPassword}
                    disabled
                    onChange={() => {}}
                  />
                ) : (
                  <Controller
                    name='email_login_password'
                    control={control}
                    render={({ field }) => <InputPasswordToggle id='email_login_password' {...field} />}
                  />
                )}
                <FormText color='muted'>
                  {samePasswordAsLogin
                    ? 'Mirrors the login password above - type a new login password to change this too.'
                    : emailUsernameMode
                    ? "The eye icon reveals this mailbox's real, current password. Required to create the mailbox above on save; changing it here updates the real mailbox's password too."
                    : "The eye icon reveals this mailbox account's real, current password."}
                </FormText>
              </Col>
            )}
            <Col md={12} className='mb-1'>
              <Label className='form-label' for='email_signature'>
                Email Signature
              </Label>
              <Controller
                name='email_signature'
                control={control}
                render={({ field }) => (
                  <Editor
                    value={field.value}
                    onChange={field.onChange}
                    height={350}
                    placeholder="This user's email signature"
                    onImageUpload={uploadEditorImage}
                  />
                )}
              />
              <FormText color='muted'>Used when Compose auto-appends the signature below.</FormText>
            </Col>
            <Col md={12} className='mb-2 mt-50'>
              <div className='form-switch d-flex align-items-center'>
                <Input
                  type='switch'
                  id='email_signature_auto_append'
                  checked={autoAppendSignature}
                  onChange={e => {
                    setAutoAppendSignature(e.target.checked)
                    setExtraDirty(true)
                  }}
                />
                <Label className='form-check-label mb-0 ms-50' for='email_signature_auto_append'>
                  Auto-append signature when composing
                </Label>
              </div>
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default UserForm