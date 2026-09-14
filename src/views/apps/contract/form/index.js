// ** React Imports
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

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
import { frequencyOptions, contractStatusOptions } from '../contractOptions'

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
  const [file, setFile] = useState(null)
  const [existingDocPath, setExistingDocPath] = useState(null)

  const {
    control,
    reset,
    setValue,
    setError,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({ defaultValues })

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
      // Signed documents can't be carried over client-side - a clone starts
      // without one attached, same as isEdit's existingDocPath but only when
      // actually editing the original record.
      setExistingDocPath(isEdit ? ct.signed_document_path || null : null)
    }
  }, [store.selectedContract])

  // ** Quick Fill Customer
  const handleQuickFill = option => {
    setValue('client_id', option ? option.value : '')
    if (option) {
      setValue('contact_name', option.label)
      setValue('company_name', option.company_name || '')
      setValue('email', option.email || '')
      setValue('phone', option.phone || '')
      setValue('billing_address', option.address || '')
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

    const action = isEdit
      ? updateContract({ id: Number(id), contract: payload, file })
      : addContract({ contract: payload, file })

    dispatch(action).then(() => {
      toast.success(isEdit ? 'Contract updated' : 'Contract added')
      navigate('/contract')
    })
  }

  const selectedClientOption = clientOptions.find(i => i.value === clientId) || null
  const selectedFrequencyOption = frequencyOptions.find(i => i.value === frequency) || null
  const selectedStatusOption = contractStatusOptions.find(i => i.value === status) || null

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
              <h6 className='invoice-to-title mb-2'>Contract Details</h6>
              <Row>
                <Col md={3} className='mb-1'>
                  <Label className='form-label'>Frequency</Label>
                  <Select
                    className='react-select'
                    classNamePrefix='select'
                    theme={selectThemeColors}
                    options={frequencyOptions}
                    value={selectedFrequencyOption}
                    onChange={option => setValue('frequency', option ? option.value : 'monthly')}
                  />
                </Col>
                <Col md={3} className='mb-1'>
                  <Label className='form-label'>Status</Label>
                  <Select
                    className='react-select'
                    classNamePrefix='select'
                    theme={selectThemeColors}
                    options={contractStatusOptions}
                    value={selectedStatusOption}
                    onChange={option => setValue('status', option ? option.value : 'draft')}
                  />
                </Col>
                <Col md={3} className='mb-1'>
                  <Label className='form-label' for='start_date'>
                    Start date
                  </Label>
                  <Controller
                    name='start_date'
                    control={control}
                    render={({ field }) => <Input type='date' id='start_date' {...field} />}
                  />
                </Col>
                <Col md={3} className='mb-1'>
                  <Label className='form-label' for='end_date'>
                    End date
                  </Label>
                  <Controller name='end_date' control={control} render={({ field }) => <Input type='date' id='end_date' {...field} />} />
                </Col>
              </Row>
            </CardBody>

            <hr className='invoice-spacing' />

            <CardBody>
              <h6 className='invoice-to-title mb-2'>Contract Body</h6>
              <Editor value={body} onChange={setBody} height={300} />
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
                onTemplateChange={value => setValue('terms_template_id', value)}
                content={termsContent}
                onContentChange={setTermsContent}
                defaultOpen={isEdit || Boolean(cloneId)}
              />
            </CardBody>

            <hr className='invoice-spacing' />

            <CardBody>
              <PaymentMethodSection
                methodOptions={paymentMethodOptions}
                methodId={paymentMethodId}
                onMethodChange={value => setValue('payment_method_id', value)}
                content={paymentMethodContent}
                onContentChange={setPaymentMethodContent}
                defaultOpen={isEdit || Boolean(cloneId)}
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
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Signed Document</CardTitle>
            </CardHeader>
            <CardBody>
              <Label className='form-label'>Attach File (PDF, DOC, DOCX — max 10 MB)</Label>
              <Input type='file' accept='.pdf,.doc,.docx' onChange={e => setFile(e.target.files[0] || null)} />
              {existingDocPath && !file && (
                <p className='mt-1 mb-0'>
                  <a href={`${axios.defaults.baseURL}${existingDocPath}`} target='_blank' rel='noreferrer'>
                    View current signed document
                  </a>
                </p>
              )}
              <p className='text-muted small mt-1 mb-0'>Upload the signed copy of this agreement.</p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Form>
  )
}

export default ContractForm
