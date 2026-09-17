// ** React Imports
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, FormText, Button } from 'reactstrap'

// ** Custom Components
import InputPasswordToggle from '@components/input-password-toggle'

const defaultValues = {
  current_password: '',
  new_password: '',
  confirm_password: ''
}

// ** A dedicated page (navbar dropdown's "Change Password", see
// UserDropdown.js) rather than the full Account Settings form - and
// deliberately its own POST /account/change-password endpoint rather than
// UserController::update()'s generic 'password' field, since that one
// requires no proof of the current password (an admin uses it to reset
// someone else's). Requiring the current password here means a session
// left open/unlocked can't have its password silently changed by whoever's
// sitting at it.
const ChangePassword = () => {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const {
    control,
    reset,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const onSubmit = data => {
    if (data.new_password.length < 6) {
      setError('new_password', { type: 'manual', message: 'Minimum 6 characters' })
      return
    }
    if (data.new_password !== data.confirm_password) {
      setError('confirm_password', { type: 'manual', message: 'Passwords do not match' })
      return
    }

    setSaving(true)
    axios
      .post('/account/change-password', {
        current_password: data.current_password,
        new_password: data.new_password
      })
      .then(() => {
        toast.success('Password updated')
        setSaving(false)
        reset(defaultValues)
      })
      .catch(err => {
        setSaving(false)
        const message = err?.response?.data?.message || 'Failed to update password'
        // The one failure mode worth pointing at a specific field - every
        // other validation error is already caught client-side above.
        if (err?.response?.status === 422 && message === 'Current password is incorrect') {
          setError('current_password', { type: 'manual', message })
        }
        toast.error(message)
      })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>Change Password</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='current_password'>
                Current Password <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='current_password'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <InputPasswordToggle id='current_password' invalid={errors.current_password && true} {...field} />
                )}
              />
              {errors.current_password?.message && (
                <FormText color='danger'>{errors.current_password.message}</FormText>
              )}
            </Col>
          </Row>
          <Row>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='new_password'>
                New Password <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='new_password'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <InputPasswordToggle id='new_password' invalid={errors.new_password && true} {...field} />
                )}
              />
              <FormText color={errors.new_password ? 'danger' : 'muted'}>
                {errors.new_password?.message || 'Minimum 6 characters'}
              </FormText>
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='confirm_password'>
                Confirm New Password <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='confirm_password'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <InputPasswordToggle id='confirm_password' invalid={errors.confirm_password && true} {...field} />
                )}
              />
              {errors.confirm_password?.message && (
                <FormText color='danger'>{errors.confirm_password.message}</FormText>
              )}
            </Col>
          </Row>
          <div className='d-flex' style={{ gap: '0.75rem' }}>
            <Button type='submit' color='primary' disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type='button' color='secondary' outline onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  )
}

export default ChangePassword
