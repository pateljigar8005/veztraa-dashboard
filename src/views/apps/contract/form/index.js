import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { Editor } from '@veztraa/editor'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { selectThemeColors, uploadEditorImage, formatAmount, sortOptions, clientOptionLabel } from '@utils'
import TermsSection from '../../shared/TermsSection'
import PaymentMethodSection from '../../shared/PaymentMethodSection'
import LineItemsTable from '../../shared/LineItemsTable'
import CatalogModal from '../../shared/CatalogModal'
import AmountField from '../../shared/AmountField'
import DateField from '../../shared/DateField'
import { addContract, updateContract, getContract } from '../store'
import { frequencyOptions } from '../contractOptions'
import { discountTypeOptions } from '../../quotation/documentOptions'

const defaultValues = {
  contact_name: '',
  company_name: '',
  email: '',
  phone: '',
  billing_address: '',
  start_date: '',
  end_date: '',
  status: 'draft',
  internal_notes: '',
  currency: 'USD',
  tax_rate: 0,
  discount_value: 0,
  line_items: [{ description: '', qty: 1, rate: 0 }]
}

const ContractForm = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const preselectedClientId = searchParams.get('client_id')
  const cloneId = searchParams.get('clone')
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.contracts)

  const [clientOptions, setClientOptions] = useState([])
  const [currencyOptions, setCurrencyOptions] = useState([])
  const [templateOptions, setTemplateOptions] = useState([])
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([])
  const [body, setBody] = useState('')
  const [termsContent, setTermsContent] = useState('')
  const [paymentMethodContent, setPaymentMethodContent] = useState('')
  const [extraDirty, setExtraDirty] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [taxEnabled, setTaxEnabled] = useState(true)

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

  const { fields, append, remove, move } = useFieldArray({ control, name: 'line_items' })

  const clientId = watch('client_id')
  const frequency = watch('frequency')
  const status = watch('status')
  const templateId = watch('terms_template_id')
  const paymentMethodId = watch('payment_method_id')
  const currency = watch('currency')
  const lineItems = watch('line_items')
  const taxRate = watch('tax_rate')
  const discountValue = watch('discount_value')
  const discountType = watch('discount_type')

  useEffect(() => {
    axios.get('/clients', { params: { perPage: 100 } }).then(response => {
      setClientOptions(
        sortOptions(
          response.data.data.clients.map(c => ({
            value: c.id,
            label: clientOptionLabel(c),
            contact_name: c.fullName,
            company_name: c.company_name,
            email: c.email,
            phone: c.phone,
            address: c.address
          }))
        )
      )
    })
    axios.get('/currencies', { params: { perPage: 100 } }).then(response => {
      setCurrencyOptions(
        sortOptions(response.data.data.currencies.filter(c => c.is_active).map(c => ({ value: c.icon, label: `${c.name} (${c.icon})` })))
      )
    })
    axios.get('/terms-templates', { params: { perPage: 100 } }).then(response => {
      setTemplateOptions(sortOptions(response.data.data.termsTemplates.map(t => ({ value: t.id, label: t.name, content: t.content }))))
    })
    axios.get('/payment-methods', { params: { perPage: 100 } }).then(response => {
      setPaymentMethodOptions(
        sortOptions(
          response.data.data.paymentMethods
            .filter(m => m.is_active)
            .map(m => ({ value: m.id, label: m.name, content: m.description }))
        )
      )
    })
    axios.get('/company').then(response => {
      setTaxEnabled(!!response.data.data.tax_enabled)
      // A brand new contract defaults to the company's configured currency -
      // edit/clone load their own saved currency instead (see the
      // store.selectedContract effect below), so this must not clobber that.
      if (!isEdit && !cloneId && response.data.data.currency_icon) {
        setValue('currency', response.data.data.currency_icon)
      }
    })
  }, [])

  useEffect(() => {
    if (!isEdit && preselectedClientId) {
      setValue('client_id', Number(preselectedClientId))
    }
  }, [preselectedClientId])

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
        internal_notes: ct.internal_notes || '',
        tax_rate: ct.tax_rate || 0,
        discount_value: ct.discount_value || 0,
        line_items: ct.line_items && ct.line_items.length ? ct.line_items : defaultValues.line_items
      })
      setValue('client_id', ct.client_id || '')
      setValue('frequency', ct.frequency || 'monthly')
      setValue('status', ct.status || 'draft')
      setValue('terms_template_id', ct.terms_template_id || '')
      setValue('payment_method_id', ct.payment_method_id || '')
      setValue('currency', ct.currency || 'USD')
      setValue('discount_type', ct.discount_type || '$')
      setBody(ct.body || '')
      setTermsContent(ct.terms_content || '')
      setPaymentMethodContent(ct.payment_method_content || '')
    }
  }, [store.selectedContract])

  const handleQuickFill = option => {
    setValue('client_id', option ? option.value : '', { shouldDirty: true })
    if (option) {
      setValue('contact_name', option.contact_name, { shouldDirty: true })
      setValue('company_name', option.company_name || '', { shouldDirty: true })
      setValue('email', option.email || '', { shouldDirty: true })
      setValue('phone', option.phone || '', { shouldDirty: true })
      setValue('billing_address', option.address || '', { shouldDirty: true })
    }
  }

  const handleAddFromCatalog = items => {
    if (lineItems.length === 1 && !lineItems[0].description) {
      remove(0)
    }
    items.forEach(item => append({ description: item.name, qty: 1, rate: item.price }))
  }

  const subtotal = (lineItems || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0)
  const taxAmount = taxEnabled ? subtotal * ((Number(taxRate) || 0) / 100) : 0
  const discountAmount =
    discountType === '%' ? subtotal * ((Number(discountValue) || 0) / 100) : Number(discountValue) || 0
  const total = subtotal + taxAmount - discountAmount

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
      currency: currency || 'USD',
      line_items: data.line_items,
      tax_rate: taxEnabled ? Number(data.tax_rate) || 0 : 0,
      discount_value: Number(data.discount_value) || 0,
      discount_type: discountType || '$',
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

            <LineItemsTable
              control={control}
              fields={fields}
              lineItems={lineItems}
              remove={remove}
              move={move}
              onAddItem={() => append({ description: '', qty: 1, rate: 0 })}
              onOpenCatalog={() => setCatalogOpen(true)}
              currency={currency}
            />

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
                onImageUpload={uploadEditorImage}
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
          <div style={{ position: 'sticky', top: '7rem' }}>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Contract Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Label className='form-label'>Currency</Label>
              <Select
                className='react-select mb-1'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={currencyOptions}
                value={currencyOptions.find(i => i.value === currency) || null}
                onChange={option => setValue('currency', option ? option.value : 'USD', { shouldDirty: true })}
              />

              <Label className='form-label'>Frequency</Label>
              <Select
                className='react-select mb-1'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={frequencyOptions}
                value={selectedFrequencyOption}
                onChange={option => setValue('frequency', option ? option.value : 'monthly', { shouldDirty: true })}
              />
              {frequency && frequency !== 'one_time' && (
                <p className='text-muted small'>
                  A draft invoice is generated automatically each {frequency} period while this contract is Active/Signed.
                </p>
              )}

              <Label className='form-label' for='start_date'>
                Start date
              </Label>
              <Controller
                name='start_date'
                control={control}
                render={({ field }) => (
                  <DateField id='start_date' className='mb-1' value={field.value} onChange={field.onChange} />
                )}
              />

              <Label className='form-label' for='end_date'>
                End date
              </Label>
              <Controller
                name='end_date'
                control={control}
                render={({ field }) => <DateField id='end_date' value={field.value} onChange={field.onChange} />}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Totals</CardTitle>
            </CardHeader>
            <CardBody>
              <div className='d-flex justify-content-between mb-1'>
                <span>Subtotal</span>
                <span>{currency || '$'}{formatAmount(subtotal)}</span>
              </div>
              {taxEnabled && (
                <>
                  <Label className='form-label' for='tax_rate'>
                    Tax Rate (%)
                  </Label>
                  <Controller
                    name='tax_rate'
                    control={control}
                    render={({ field }) => <Input type='number' step='0.01' min='0' id='tax_rate' className='mb-1' {...field} />}
                  />
                  <div className='d-flex justify-content-between mb-1'>
                    <span>Tax Amount</span>
                    <span>{currency || '$'}{formatAmount(taxAmount)}</span>
                  </div>
                </>
              )}

              <Label className='form-label'>Discount</Label>
              <div className='d-flex mb-1'>
                <Controller
                  name='discount_value'
                  control={control}
                  render={({ field }) => <AmountField value={field.value} onChange={field.onChange} />}
                />
                <Select
                  className='react-select ms-1'
                  classNamePrefix='select'
                  theme={selectThemeColors}
                  options={discountTypeOptions}
                  value={discountTypeOptions.find(i => i.value === discountType) || null}
                  onChange={option => setValue('discount_type', option ? option.value : '$', { shouldDirty: true })}
                  styles={{ container: base => ({ ...base, minWidth: '70px' }) }}
                />
              </div>
              <div className='d-flex justify-content-between mb-2'>
                <span>Discount</span>
                <span className='text-success'>-{currency || '$'}{formatAmount(discountAmount)}</span>
              </div>

              <hr />
              <div className='d-flex justify-content-between mb-2'>
                <h5 className='mb-0'>Total</h5>
                <h5 className='mb-0'>{currency || '$'}{formatAmount(total)}</h5>
              </div>
            </CardBody>
          </Card>
          </div>
        </Col>
      </Row>
      <CatalogModal isOpen={catalogOpen} toggle={() => setCatalogOpen(!catalogOpen)} onAdd={handleAddFromCatalog} />
    </Form>
  )
}

export default ContractForm