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
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, FormText, InputGroup, InputGroupText } from 'reactstrap'

// ** Store & Actions
import { addUser, updateUser, getUser, uploadAvatar } from '../store'

// ** Custom Components
import InputPasswordToggle from '@components/input-password-toggle'
import ImageUploadField from '../../shared/ImageUploadField'
import { Editor } from '@veztraa/editor'

// ** Utils
import { getUserData, resolveAvatarUrl, uploadEditorImage } from '@utils'

// ** The login password is one-way bcrypt-hashed (see User::update()) and
// can never be sent back from the API under any circumstance - this is
// purely a visual stand-in so an existing edit doesn't look like there's no
// password set at all. Treated as "unchanged" on submit, same as an empty
// field used to be - only a value that DIFFERS from this exact placeholder
// counts as the user actually typing a new password. The email account
// password (email_login_password) is reversibly encrypted server-side and
// IS sent back in full to an admin viewer (see UserController::serialize()),
// so that field shows the real current value instead of this placeholder.
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
  // Company-wide mailbox domain (see Company Settings > Mailbox
  // Provisioning) - when set, the single Email field above doubles as the
  // mailbox name too (just a username, with this domain fixed as a
  // suffix), and saving provisions a real mailbox via cPanel with that
  // same address - no separate mailbox address field. When it's not
  // configured, Email stays a normal full address used only for login,
  // and the old separate free-text mailbox address field (email_login)
  // is back in the Email Settings section for legacy IMAP/SMTP setups.
  const [mailDomain, setMailDomain] = useState('')
  const [mailDomainLoaded, setMailDomainLoaded] = useState(false)
  const [emailUsernameMode, setEmailUsernameMode] = useState(false)
  // Whether the mailbox password should just mirror the login password
  // field above instead of being set independently - defaults on since
  // that's the common case, and it's always safe to leave on: it only
  // actually sends a new mailbox password when a new LOGIN password is
  // typed (see onSubmit) - the bcrypt-hashed login password can't be read
  // back to "keep them in sync" any other way.
  const [samePasswordAsLogin, setSamePasswordAsLogin] = useState(true)
  // Tracks edits to the state above (role, avatar), none of which is
  // registered with react-hook-form, so its own isDirty can't see them.
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

  // ** Fetch roles for the dropdown
  useEffect(() => {
    axios.get('/roles').then(response => {
      const data = response.data.data
      setRoles(data)
      if (!isEdit && data.length) setRoleId(String(data[0].id))
    })
  }, [])

  // ** Fetch the company's mailbox domain, if mailbox provisioning is set up
  useEffect(() => {
    axios.get('/company').then(response => {
      setMailDomain(response.data.data.mail_domain || '')
      setMailDomainLoaded(true)
    })
  }, [])

  // ** Fetch the user being edited
  useEffect(() => {
    if (isEdit) dispatch(getUser(id))
  }, [id])

  // ** Decide username-vs-plain mode as soon as the mail domain is known -
  // for a new user there's no existing address to check against, so
  // provisioning being configured at all is enough to switch the Email
  // field over.
  useEffect(() => {
    if (mailDomainLoaded && !isEdit) setEmailUsernameMode(Boolean(mailDomain))
  }, [mailDomainLoaded, mailDomain, isEdit])

  // ** Populate the form once the user loads (and, since it decides
  // username-vs-plain mode for the Email field below, the mail domain has
  // loaded too)
  useEffect(() => {
    if (isEdit && store.selectedUser && store.selectedUser.id === Number(id) && mailDomainLoaded) {
      const user = store.selectedUser
      const email = user.email || ''
      const suffix = mailDomain ? `@${mailDomain}` : ''
      // Only switches to username mode when the existing login address
      // actually ends in the currently-configured domain - an address on
      // some other domain (or set before provisioning was configured)
      // falls back to the old plain full-address field instead of
      // showing a wrong/truncated guess.
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
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name,
        email_signature: data.email_signature,
        email_signature_auto_append: autoAppendSignature,
        // Persisted so the switch's state survives a reload/reopen instead
        // of always resetting to its default - see the populate effect's
        // own setSamePasswordAsLogin(user.email_login_password_synced).
        email_login_password_synced: samePasswordAsLogin
      }
      // Mailbox provisioning configured (see Company Settings) - a single
      // Email field doubles as both the login identity and the mailbox
      // name, so login email and mailbox address are always the same
      // address rather than two separately-typed fields. Otherwise, same
      // plain full-address login field (and separately-typed mailbox
      // address) this always was.
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
        // Mirrors the login password exactly - only when a NEW one was
        // actually typed above. There's no plaintext to mirror otherwise
        // (the stored login password is one-way hashed), so leaving the
        // login password untouched here also leaves the mailbox password
        // untouched, same as toggling this off and leaving that field blank.
        if (newLoginPassword) payload.email_login_password = newLoginPassword
      } else if (data.email_login_password.length) {
        // Unlike the login password above, this field shows the real
        // current value (see the populate effect) rather than a
        // placeholder - resending it unchanged is harmless (the API just
        // re-encrypts the same plaintext), so there's no placeholder-diff
        // check needed here.
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
          {/* Its own full-width row rather than sharing a row with either
              column's label below - this theme's switch control is taller
              than a line of label text (see _variables.scss's
              $form-switch-height), so squeezing it inline next to the
              "Password" label threw off the label/input alignment between
              the two columns below it. */}
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
            {/* Only visible on the admin User module's own edit page, not
                self-service Account Settings - this mailbox account's
                credentials aren't something a user manages themselves here.
                Hidden entirely once the Email field above already doubles
                as the mailbox address (emailUsernameMode) - shown only as
                a fallback for a legacy address that predates provisioning,
                or when provisioning isn't configured at all. */}
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
