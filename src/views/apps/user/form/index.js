// ** React Imports
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

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
import InputPasswordToggle from '@components/input-password-toggle'
import ImageUploadField from '../../shared/ImageUploadField'
import { Editor } from '@veztraa/editor'

// ** Utils
import { getUserData, resolveAvatarUrl, uploadEditorImage } from '@utils'

// ** The real password (login or email account) is never sent back from the
// API (see UserController::serialize()'s own comment on this) - this is
// purely a visual stand-in so an existing edit doesn't look like there's no
// password set at all. Treated as "unchanged" on submit, same as an empty
// field used to be - only a value that DIFFERS from this exact placeholder
// counts as the user actually typing a new password.
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

// ** selfMode: the "Account Settings" entry in the navbar's own user
// dropdown (see UserDropdown.js) renders this same form against the
// CURRENT user's own id instead of a route param - unlike /user/edit/:id,
// its route isn't gated by the "users" module permission (it doesn't match
// any pattern in navPermissions.js's routeToMenuId, so PrivateRoute allows
// it for anyone logged in - see that file's own "fails open" note), so
// self-service profile editing works regardless of role. Role and password
// aren't editable here at all (see where each Col is conditionally
// rendered below) - letting a user pick their own role would be a
// privilege-escalation path, and password now has its own dedicated,
// current-password-verified page (see UserDropdown.js's "Change
// Password"). Login email is shown but disabled too, same reasoning as
// role - it's an identity field, not something to self-serve unchecked.
//
// Detected from the pathname rather than a prop on the route's <UserForm />
// element - router/routes/index.js decides whether to wrap a route in the
// normal layout (the thing that renders .app-content, without which the
// sidebar overlaps the page - see its own isObjEmpty(route.baseElement.props)
// check) based on whether that element has ANY props at all. A literal
// `<UserForm selfMode />` on the /account-settings route entry trips that
// check and silently skips the layout wrapper - this stays prop-less
// instead.
const UserForm = () => {
  // ** Hooks & Vars
  const location = useLocation()
  const selfMode = location.pathname === '/account-settings'
  const { id: routeId } = useParams()
  const id = selfMode ? getUserData()?.id : routeId
  const isEdit = selfMode ? true : Boolean(routeId)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.users)

  // ** States
  const [roles, setRoles] = useState([])
  const [roleId, setRoleId] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  // Whether Compose auto-appends this user's signature - a persisted
  // per-user default (see ComposePopup.js's own fetch of it), not a
  // per-email toggle, so it lives here as a plain switch rather than
  // through react-hook-form like the signature content itself.
  const [autoAppendSignature, setAutoAppendSignature] = useState(true)
  // Tracks edits to the state above (role, avatar), none of which is
  // registered with react-hook-form, so its own isDirty can't see them.
  const [extraDirty, setExtraDirty] = useState(false)

  const {
    control,
    reset,
    setError,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty || extraDirty)

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
        password: PASSWORD_PLACEHOLDER,
        email_login: user.email_login || '',
        email_login_password: user.email_login ? PASSWORD_PLACEHOLDER : '',
        email_signature: user.email_signature || ''
      })
      setAutoAppendSignature(user.email_signature_auto_append !== false)
      if (user.role_id) setRoleId(String(user.role_id))
      setAvatarPreview(resolveAvatarUrl(user.avatar))
    }
  }, [store.selectedUser])

  // ** Edit mode: upload immediately since the user already has an id.
  // Add mode: just stage the file - it's uploaded right after the new
  // user is created, once a real id exists to attach it to.
  const handleAvatarChange = file => {
    setAvatarPreview(URL.createObjectURL(file))
    if (isEdit) {
      dispatch(uploadAvatar({ id: Number(id), file })).then(() => toast.success('Avatar updated'))
    } else {
      setAvatarFile(file)
      setExtraDirty(true)
    }
  }

  // ** Add mode: nothing saved yet, just clear the staged file. Edit mode:
  // the avatar is already persisted, so clearing it is a real update.
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
        email: data.email,
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name,
        email_login: data.email_login,
        email_signature: data.email_signature,
        email_signature_auto_append: autoAppendSignature
      }
      if (data.password.length && data.password !== PASSWORD_PLACEHOLDER) payload.password = data.password
      if (data.email_login_password.length && data.email_login_password !== PASSWORD_PLACEHOLDER) {
        payload.email_login_password = data.email_login_password
      }

      // .unwrap() so a real save failure (e.g. the 422 a bad request body
      // gets) actually rejects here instead of silently falling through to
      // the success toast + navigate below - a plain dispatch(action).then()
      // resolves either way, which is exactly how a failed save could look
      // identical to a successful one.
      const action = isEdit ? updateUser({ id: Number(id), ...payload }) : addUser(payload)
      dispatch(action)
        .unwrap()
        .then(result => {
          toast.success(selfMode ? 'Account updated' : isEdit ? 'User updated' : 'User added')
          // A settings page you stay on, not a create/edit-then-back-to-list
          // flow - same as Company Settings. Since we stay, react-hook-form's
          // own dirty baseline has to move too - otherwise isDirty keeps
          // comparing against the values from the ORIGINAL page load, and
          // the navbar's unsaved-changes guard keeps prompting to discard
          // changes that were, in fact, just saved. Both password fields go
          // back to the placeholder, same as any other fresh load.
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
              {selfMode && <FormText color='muted'>Contact an admin to change your login email.</FormText>}
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
            {/* Neither field is shown in Account Settings at all - password
                has its own dedicated, current-password-verified page (see
                UserDropdown.js's "Change Password"), and self-selecting your
                own role would be a privilege-escalation path. Both stay
                fully editable from the admin User module's own edit page. */}
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
                        // Selects the placeholder dots so the first
                        // keystroke cleanly replaces the whole thing,
                        // rather than a partial edit mixing real characters
                        // into what's sent as the "new" password.
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
          <Row>
            {/* Only visible on the admin User module's own edit page, not
                self-service Account Settings - this mailbox account's
                credentials aren't something a user manages themselves here. */}
            {!selfMode && (
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
            )}
            {!selfMode && (
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='email_login_password'>
                  Password
                </Label>
                <Controller
                  name='email_login_password'
                  control={control}
                  render={({ field }) => (
                    <InputPasswordToggle
                      id='email_login_password'
                      {...field}
                      onFocus={e => {
                        if (field.value === PASSWORD_PLACEHOLDER) e.target.select()
                      }}
                    />
                  )}
                />
                <FormText color='muted'>
                  Leave as-is to keep the current email password - the eye icon reveals what you type, not the existing one
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
