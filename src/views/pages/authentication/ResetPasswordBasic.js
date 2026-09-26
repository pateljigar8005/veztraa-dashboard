import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import useJwt from '@src/@core/auth/jwt/useJwt'
import InputPasswordToggle from '@components/input-password-toggle'
import { Card, CardBody, CardTitle, CardText, Form, Label, Button, Alert } from 'reactstrap'
import logo from '@src/assets/images/logo/logo-full.svg'
import '@styles/react/pages/page-authentication.scss'

const { jwt } = useJwt({})

const defaultValues = { password: '', confirmPassword: '' }

const ResetPasswordBasic = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    control,
    watch,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({ defaultValues })

  const password = watch('password')

  const onSubmit = data => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' })
      return
    }

    setLoading(true)
    jwt
      .resetPassword({ token, password: data.password })
      .then(() => {
        toast.success('Password reset. You can now sign in.')
        navigate('/login')
      })
      .catch(err => {
        setError('password', {
          type: 'manual',
          message: err.response?.data?.message || 'This reset link is invalid or has expired.'
        })
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className='auth-wrapper auth-basic px-2'>
      <div className='auth-inner my-2'>
        <Card className='mb-0'>
          <CardBody>
            <Link className='brand-logo' to='/' onClick={e => e.preventDefault()}>
              <img src={logo} alt='Veztraa' height='42' />
            </Link>
            <CardTitle tag='h4' className='mb-1'>
              Reset Password 🔒
            </CardTitle>
            {!token ? (
              <Alert color='danger' className='mb-2'>
                This reset link is missing its token. Please use the link from your email, or request a new one.
              </Alert>
            ) : (
              <>
                <CardText className='mb-2'>Enter a new password for your account</CardText>
                <Form className='auth-reset-password-form mt-2' onSubmit={handleSubmit(onSubmit)}>
                  <div className='mb-1'>
                    <Label className='form-label' for='new-password'>
                      New Password
                    </Label>
                    <Controller
                      id='password'
                      name='password'
                      control={control}
                      rules={{ required: true, minLength: 8 }}
                      render={({ field }) => (
                        <InputPasswordToggle
                          className='input-group-merge'
                          invalid={errors.password && true}
                          {...field}
                        />
                      )}
                    />
                    {errors.password && (
                      <small className='text-danger'>
                        {errors.password.message || 'Password must be at least 8 characters'}
                      </small>
                    )}
                  </div>
                  <div className='mb-1'>
                    <Label className='form-label' for='confirm-password'>
                      Confirm Password
                    </Label>
                    <Controller
                      id='confirmPassword'
                      name='confirmPassword'
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <InputPasswordToggle
                          className='input-group-merge'
                          invalid={errors.confirmPassword && true}
                          {...field}
                        />
                      )}
                    />
                    {errors.confirmPassword && (
                      <small className='text-danger'>{errors.confirmPassword.message || 'Required'}</small>
                    )}
                  </div>
                  <Button color='primary' block disabled={loading || !password}>
                    Set new password
                  </Button>
                </Form>
              </>
            )}
            <p className='text-center mt-2'>
              <Link to='/login'>
                <span className='align-middle'>Back to login</span>
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default ResetPasswordBasic
