import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'react-feather'
import { useForm, Controller } from 'react-hook-form'
import useJwt from '@src/@core/auth/jwt/useJwt'
import { Card, CardBody, CardTitle, CardText, Form, Label, Input, Button, FormFeedback } from 'reactstrap'
import logo from '@src/assets/images/logo/logo-full.svg'
import '@styles/react/pages/page-authentication.scss'

const { jwt } = useJwt({})

const defaultValues = { email: '' }

const ForgotPasswordBasic = () => {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({ defaultValues })

  const onSubmit = data => {
    setLoading(true)
    jwt
      .forgotPassword({ email: data.email })
      .then(() => setSubmitted(true))
      .catch(err => {
        setError('email', {
          type: 'manual',
          message: err.response?.data?.message || 'Something went wrong. Please try again.'
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
              Forgot Password? 🔒
            </CardTitle>
            {submitted ? (
              <CardText className='mb-2'>
                If an account exists for that email, we've sent a link to reset your password. Please check your
                inbox.
              </CardText>
            ) : (
              <>
                <CardText className='mb-2'>
                  Enter your email and we'll send you instructions to reset your password
                </CardText>
                <Form className='auth-forgot-password-form mt-2' onSubmit={handleSubmit(onSubmit)}>
                  <div className='mb-1'>
                    <Label className='form-label' for='login-email'>
                      Email
                    </Label>
                    <Controller
                      id='email'
                      name='email'
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Input
                          autoFocus
                          type='email'
                          placeholder='john@example.com'
                          invalid={errors.email && true}
                          {...field}
                        />
                      )}
                    />
                    {errors.email && <FormFeedback>{errors.email.message || 'Email is required'}</FormFeedback>}
                  </div>
                  <Button color='primary' block disabled={loading}>
                    Send reset link
                  </Button>
                </Form>
              </>
            )}
            <p className='text-center mt-2'>
              <Link to='/login'>
                <ChevronLeft className='rotate-rtl me-25' size={14} />
                <span className='align-middle'>Back to login</span>
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPasswordBasic
