// ** React Imports
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

// ** Hooks
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { Editor } from '@veztraa/editor'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'

// ** Utils
import { selectThemeColors } from '@utils'

// ** Shared Components
import TermsSection from '../../shared/TermsSection'
import PaymentMethodSection from '../../shared/PaymentMethodSection'

// ** Store & Actions
import { addContract, updateContract, getContract } from '../store'

// ** Options
import { frequencyOptions } from '../contractOptions'

const defaultValues = {
  contact_name: '',
  company_name: '',
  email: '',
  phone: '',
  billing_address: '',
  start_date: '',
  end_date: '',
  status: 'draft',
  internal_notes: ''
}

const ContractForm = () => {
  // ** Hooks & Vars
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const preselectedClientId = searchParams.get('client_id')
  const cloneId = searchParams.get('clone')
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.contracts)

  const [clientOptions, setClientOptions] = useState([])
  const [templateOptions, setTemplateOptions] = useState([])
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([])
  const [body, setBody] = useState('')
  const [termsContent, setTermsContent] = useState('')
  const [paymentMethodContent, setPaymentMethodContent] = useState('')
  // Tracks edits to the state above, none of which is registered with
  // react-hook-form, so its own isDirty can't see them.
  const [extraDirty, setExtraDirty] = useState(false)

  const {
    control,
    reset,
    setValue,
    setError,
    handleSubmit,
    watch,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty || extraDirty)

  const clientId = watch('client_id')
  const frequency = watch('frequency')
  const status = watch('status')
  const templateId = watch('terms_template_id')
  const paymentMethodId = watch('payment_method_id')

  useEffect(() => {
    axios.get('/clients', { params: { perPage: 100 } }).then(response => {
      setClientOptions(
        response.data.data.clients.map(c => ({
          value: c.id,
          label: c.fullName,
          company_name: c.company_name,
          email: c.email,
          phone: c.phone,
          address: c.address
        }))
      )
    })
    axios.get('/terms-templates', { params: { perPage: 100 } }).then(response => {
      setTemplateOptions(response.data.data.termsTemplates.map(t => ({ value: t.id, label: t.name, content: t.content })))
    })
    axios.get('/payment-methods', { params: { perPage: 100 } }).then(response => {
      setPaymentMethodOptions(
        response.data.data.paymentMethods
          .filter(m => m.is_active)
          .map(m => ({ value: m.id, label: m.name, content: m.description }))
      )
    })
  }, [])

  useEffect(() => {
    if (!isEdit && preselectedClientId) {
      setValue('client_id', Number(preselectedClientId))
    }
  }, [preselectedClientId])

  // ** Fetch the contract being edited, or the source contract being cloned
  useEffect(() => {
    if (isEdit) dispatch(getContract(id))
    else if (cloneId) dispatch(getContract(cloneId))
  }, [id, cloneId])

  useEffect(() => {
    const sourceId = isEdit ? Number(id) : Number(cloneId)
    if (sourceId && store.selectedContract && store.selectedContract.id === sourceId) {
      const ct = store.selectedContract
      reset({
        contact_name: ct.contact_name || '',
        company_name: ct.company_name || '',
        email: ct.email || '',
        phone: ct.phone || '',
        billing_address: ct.billing_address || '',
        start_date: ct.start_date || '',
        end_date: ct.end_date || '',
        internal_notes: ct.internal_notes || ''
      })
      setValue('client_id', ct.client_id || '')
      setValue('frequency', ct.frequency || 'monthly')
      setValue('status', ct.status || 'draft')
      setValue('terms_template_id', ct.terms_template_id || '')
      setValue('payment_method_id', ct.payment_method_id || '')
      setBody(ct.body || '')
      setTermsContent(ct.terms_content || '')
      setPaymentMethodContent(ct.payment_method_content || '')
    }
  }, [store.selectedContract])

  // ** Quick Fill Customer
  const handleQuickFill = option => {
    setValue('client_id', option ? option.value : '', { shouldDirty: true })
    if (option) {
      setValue('contact_name', option.label, { shouldDirty: true })
      setValue('company_name', option.company_name || '', { shouldDirty: true })
      setValue('email', option.email || '', { shouldDirty: true })
      setValue('phone', option.phone || '', { shouldDirty: true })
      setValue('billing_address', option.address || '', { shouldDirty: true })
    }
  }

  const onSubmit = data => {
    if (!data.contact_name || data.contact_name.length === 0) {
      setError('contact_name', { type: 'manual' })
      return
    }

    const payload = {
      body,
      status: status || 'draft',
      client_id: clientId || null,
      contact_name: data.contact_name,
      company_name: data.company_name,
      email: data.email,
      phone: data.phone,
      billing_address: data.billing_address,
      frequency: frequency || 'monthly',
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      terms_template_id: templateId || null,
      terms_content: termsContent,
      payment_method_id: paymentMethodId || null,
      payment_method_content: paymentMethodContent,
      internal_notes: data.internal_notes
    }

    const action = isEdit ? updateContract({ id: Number(id), contract: payload }) : addContract({ contract: payload })

    dispatch(action).then(result => {
      toast.success(isEdit ? 'Contract updated' : 'Contract added')
      navigate(`/contract/view/${result.payload.id}`)
    })
  }

  const selectedClientOption = clientOptions.find(i => i.value === clientId) || null
  const selectedFrequencyOption = frequencyOptions.find(i => i.value === frequency) || null

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Col lg='8'>
          <Card>
            <CardBody>
              <h6 className='invoice-to-title'>Bill To</h6>
              <Label className='form-label'>⚡ Quick Fill Customer</Label>
              <Select
                isClearable
                className='react-select mb-1'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={clientOptions}
                value={selectedClientOption}
                onChange={handleQuickFill}
                placeholder='Type to search customers...'
              />
              <p className='text-muted small mb-2'>Selecting a customer will auto-fill the billing fields below.</p>

              <Row>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='contact_name'>
                    Contact Name <span className='text-danger'>*</span>
                  </Label>
                  <Controller
                    name='contact_name'
                    control={control}
                    render={({ field }) => <Input id='contact_name' invalid={errors.contact_name && true} {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='company_name'>
                    Company Name
                  </Label>
                  <Controller
                    name='company_name'
                    control={control}
                    render={({ field }) => <Input id='company_name' {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='email'>
                    Email
                  </Label>
                  <Controller name='email' control={control} render={({ field }) => <Input type='email' id='email' {...field} />} />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='phone'>
                    Phone
                  </Label>
                  <Controller name='phone' control={control} render={({ field }) => <Input id='phone' {...field} />} />
                </Col>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='billing_address'>
                    Billing Address
                  </Label>
                  <Controller
                    name='billing_address'
                    control={control}
                    render={({ field }) => <Input type='textarea' rows='3' id='billing_address' {...field} />}
                  />
                </Col>
              </Row>
            </CardBody>

            <hr className='invoice-spacing' />

            <CardBody>
              <h6 className='invoice-to-title mb-2'>Contract Body</h6>
              <Editor
                value={body}
                onChange={value => {
                  setBody(value)
                  setExtraDirty(true)
                }}
                height={300}
              />
              <p className='text-muted small mt-1 mb-0'>
                Write the full contract text — scope, deliverables, payment terms, responsibilities, etc.
              </p>
            </CardBody>

            <hr className='invoice-spacing' />

            <CardBody>
              <h6 className='invoice-to-title mb-2'>Terms & Conditions</h6>
              <TermsSection
                templateOptions={templateOptions}
                templateId={templateId}
                onTemplateChange={value => setValue('terms_template_id', value, { shouldDirty: true })}
                content={termsContent}
                onContentChange={value => {
                  setTermsContent(value)
                  setExtraDirty(true)
                }}
                defaultOpen
              />
            </CardBody>

            <hr className='invoice-spacing' />

            <CardBody>
              <PaymentMethodSection
                methodOptions={paymentMethodOptions}
                methodId={paymentMethodId}
                onMethodChange={value => setValue('payment_method_id', value, { shouldDirty: true })}
                content={paymentMethodContent}
                onContentChange={value => {
                  setPaymentMethodContent(value)
                  setExtraDirty(true)
                }}
                defaultOpen
              />
            </CardBody>

            <hr className='invoice-spacing' />

            <CardBody>
              <h6 className='invoice-to-title mb-2'>Internal Notes</h6>
              <Controller
                name='internal_notes'
                control={control}
                render={({ field }) => (
                  <Input type='textarea' rows='3' placeholder='Internal notes — not shown on the contract PDF.' {...field} />
                )}
              />
            </CardBody>
          </Card>
        </Col>

        <Col lg='4'>
          <Card style={{ position: 'sticky', top: '7rem' }}>
            <CardHeader>
              <CardTitle tag='h4'>Contract Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Label className='form-label'>Frequency</Label>
              <Select
                className='react-select mb-1'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={frequencyOptions}
                value={selectedFrequencyOption}
                onChange={option => setValue('frequency', option ? option.value : 'monthly', { shouldDirty: true })}
              />

              <Label className='form-label' for='start_date'>
                Start date
              </Label>
              <Controller
                name='start_date'
                control={control}
                render={({ field }) => <Input type='date' id='start_date' className='mb-1' {...field} />}
              />

              <Label className='form-label' for='end_date'>
                End date
              </Label>
              <Controller name='end_date' control={control} render={({ field }) => <Input type='date' id='end_date' {...field} />} />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Form>
  )
}

export default ContractForm
