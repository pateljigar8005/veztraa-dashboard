import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useJwt from '@src/auth/jwt/useJwt'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { handleLogin } from '@store/authentication'
import { AbilityContext } from '@src/utility/context/Can'
import InputPasswordToggle from '@components/input-password-toggle'
import logo from '@src/assets/images/logo/logo-full.svg'
import { getHomeRouteForLoggedInUser } from '@utils'
import { Card, CardBody, CardTitle, CardText, Form, Label, Input, Button, FormFeedback } from 'reactstrap'
import '@styles/react/pages/page-authentication.scss'

const defaultValues = {
  password: '',
  loginEmail: ''
}

const LoginBasic = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const ability = useContext(AbilityContext)
  const [mfaToken, setMfaToken] = useState(null)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const completeLogin = res => {
    const data = { ...res.data.userData, accessToken: res.data.accessToken, refreshToken: res.data.refreshToken }
    dispatch(handleLogin(data))
    ability.update(res.data.userData.ability)
    navigate(getHomeRouteForLoggedInUser(data.role))
  }

  const onSubmit = data => {
    if (Object.values(data).every(field => field.length > 0)) {
      useJwt
        .login({ email: data.loginEmail, password: data.password })
        .then(res => {
          if (res.data.mfaRequired) {
            setMfaToken(res.data.mfaToken)
            return
          }
          completeLogin(res)
        })
        .catch(err =>
          setError('loginEmail', {
            type: 'manual',
            message: err.response?.data?.message || err.response?.data?.error || 'Invalid email or password'
          })
        )
    } else {
      for (const key in data) {
        if (data[key].length === 0) {
          setError(key, {
            type: 'manual'
          })
        }
      }
    }
  }

  const onVerifyOtp = e => {
    e.preventDefault()
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit code from your authenticator app')
      return
    }
    setVerifying(true)
    setOtpError('')
    axios
      .post('/auth/verify-otp', { mfaToken, code: otp })
      .then(res => completeLogin(res))
      .catch(err => {
        setOtpError(err.response?.data?.message || 'Invalid or expired code')
      })
      .finally(() => setVerifying(false))
  }

  if (mfaToken) {
    return (
      <div className='auth-wrapper auth-basic px-2'>
        <div className='auth-inner my-2'>
          <Card className='mb-0'>
            <CardBody>
              <Link className='brand-logo' to='/' onClick={e => e.preventDefault()}>
                <img src={logo} alt='Veztraa' height='42' />
              </Link>
              <CardTitle tag='h4' className='mb-1'>
                Two-factor authentication
              </CardTitle>
              <CardText className='mb-2'>Enter the 6-digit code from your authenticator app</CardText>
              <Form className='auth-login-form mt-2' onSubmit={onVerifyOtp}>
                <div className='mb-1'>
                  <Label className='form-label' for='otp-code'>
                    Authentication code
                  </Label>
                  <Input
                    autoFocus
                    id='otp-code'
                    inputMode='numeric'
                    maxLength={6}
                    placeholder='123456'
                    invalid={Boolean(otpError)}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  {otpError && <FormFeedback>{otpError}</FormFeedback>}
                </div>
                <Button type='submit' color='primary' block disabled={verifying}>
                  Verify
                </Button>
                <Button
                  type='button'
                  color='flat-secondary'
                  block
                  className='mt-1'
                  onClick={() => {
                    setMfaToken(null)
                    setOtp('')
                    setOtpError('')
                  }}
                >
                  Back to sign in
                </Button>
              </Form>
            </CardBody>
          </Card>
        </div>
      </div>
    )
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
              Welcome to Veztraa! 👋
            </CardTitle>
            <CardText className='mb-2'>Please sign-in to your account and start the adventure</CardText>
            <Form className='auth-login-form mt-2' onSubmit={handleSubmit(onSubmit)}>
              <div className='mb-1'>
                <Label className='form-label' for='login-email'>
                  Email
                </Label>
                <Controller
                  id='loginEmail'
                  name='loginEmail'
                  control={control}
                  render={({ field }) => (
                    <Input
                      autoFocus
                      type='email'
                      placeholder='john@example.com'
                      invalid={errors.loginEmail && true}
                      {...field}
                    />
                  )}
                />
                {errors.loginEmail && <FormFeedback>{errors.loginEmail.message}</FormFeedback>}
              </div>
              <div className='mb-1'>
                <div className='d-flex justify-content-between'>
                  <Label className='form-label' for='login-password'>
                    Password
                  </Label>
                  <Link to='/forgot-password'>
                    <small>Forgot Password?</small>
                  </Link>
                </div>
                <Controller
                  id='password'
                  name='password'
                  control={control}
                  render={({ field }) => (
                    <InputPasswordToggle className='input-group-merge' invalid={errors.password && true} {...field} />
                  )}
                />
              </div>
              <div className='form-check mb-1'>
                <Input type='checkbox' id='remember-me' />
                <Label className='form-check-label' for='remember-me'>
                  Remember Me
                </Label>
              </div>
              <Button type='submit' color='primary' block>
                Sign in
              </Button>
            </Form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default LoginBasic