import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { selectThemeColors, formatAmount } from '@utils'
import CatalogModal from '../../shared/CatalogModal'
import TermsSection from '../../shared/TermsSection'
import PaymentMethodSection from '../../shared/PaymentMethodSection'
import LineItemsTable from '../../shared/LineItemsTable'
import DateField from '../../shared/DateField'
import AmountField from '../../shared/AmountField'
import { addQuotation, updateQuotation, getQuotation } from '../store'
import { discountTypeOptions } from '../documentOptions'

const defaultValues = {
  contact_name: '',
  company_name: '',
  email: '',
  phone: '',
  billing_address: '',
  issue_date: new Date().toISOString().slice(0, 10),
  valid_until: '',
  status: 'draft',
  notes: 'Thank you for considering us!',
  tax_rate: 0,
  discount_value: 0,
  line_items: [{ description: '', qty: 1, rate: 0 }]
}

const QuotationForm = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const preselectedClientId = searchParams.get('client_id')
  const cloneId = searchParams.get('clone')
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.quotations)

  const [clientOptions, setClientOptions] = useState([])
  const [currencyOptions, setCurrencyOptions] = useState([])
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([])
  const [templateOptions, setTemplateOptions] = useState([])
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
  const status = watch('status')
  const currency = watch('currency')
  const paymentMethodId = watch('payment_method_id')
  const templateId = watch('terms_template_id')
  const lineItems = watch('line_items')
  const taxRate = watch('tax_rate')
  const discountValue = watch('discount_value')
  const discountType = watch('discount_type')

  useEffect(() => {
    axios.get('/clients', { params: { perPage: 100 } }).then(response => {
      setClientOptions(
        response.data.data.clients.map(c => ({
          value: c.id,
          label: c.fullName,
          company_name: c.company_name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          currency_icon: c.currency_icon
        }))
      )
    })
    axios.get('/currencies', { params: { perPage: 100 } }).then(response => {
      setCurrencyOptions(
        response.data.data.currencies
          .filter(c => c.is_active)
          .map(c => ({ value: c.icon, label: `${c.name} (${c.icon})` }))
      )
    })
    axios.get('/payment-methods', { params: { perPage: 100 } }).then(response => {
      setPaymentMethodOptions(
        response.data.data.paymentMethods
          .filter(m => m.is_active)
          .map(m => ({ value: m.id, label: m.name, content: m.description }))
      )
    })
    axios.get('/terms-templates', { params: { perPage: 100 } }).then(response => {
      setTemplateOptions(response.data.data.termsTemplates.map(t => ({ value: t.id, label: t.name, content: t.content })))
    })
    axios.get('/company').then(response => {
      setTaxEnabled(!!response.data.data.tax_enabled)
    })
  }, [])

  useEffect(() => {
    if (!isEdit && preselectedClientId) {
      setValue('client_id', Number(preselectedClientId))
    }
  }, [preselectedClientId])

  useEffect(() => {
    if (isEdit) dispatch(getQuotation(id))
    else if (cloneId) dispatch(getQuotation(cloneId))
  }, [id, cloneId])

  useEffect(() => {
    const sourceId = isEdit ? Number(id) : Number(cloneId)
    if (sourceId && store.selectedQuotation && store.selectedQuotation.id === sourceId) {
      const q = store.selectedQuotation
      reset({
        contact_name: q.contact_name || '',
        company_name: q.company_name || '',
        email: q.email || '',
        phone: q.phone || '',
        billing_address: q.billing_address || '',
        issue_date: q.issue_date || '',
        valid_until: q.valid_until || '',
        notes: q.notes || '',
        tax_rate: q.tax_rate || 0,
        discount_value: q.discount_value || 0,
        line_items: q.line_items && q.line_items.length ? q.line_items : [{ description: '', qty: 1, rate: 0 }]
      })
      setValue('client_id', q.client_id || '')
      setValue('status', q.status || 'draft')
      setValue('currency', q.currency || 'USD')
      setValue('payment_method_id', q.payment_method_id || '')
      setValue('terms_template_id', q.terms_template_id || '')
      setValue('discount_type', q.discount_type || '$')
      setTermsContent(q.terms_content || '')
      setPaymentMethodContent(q.payment_method_content || '')
    }
  }, [store.selectedQuotation])

  const handleQuickFill = option => {
    setValue('client_id', option ? option.value : '', { shouldDirty: true })
    if (option) {
      setValue('contact_name', option.label, { shouldDirty: true })
      setValue('company_name', option.company_name || '', { shouldDirty: true })
      setValue('email', option.email || '', { shouldDirty: true })
      setValue('phone', option.phone || '', { shouldDirty: true })
      setValue('billing_address', option.address || '', { shouldDirty: true })
      if (option.currency_icon) setValue('currency', option.currency_icon, { shouldDirty: true })
    }
  }

  const handleIssueDateChange = onChange => value => {
    onChange(value)
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
    if (!match) return

    const validUntil = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    if (isNaN(validUntil.getTime())) return

    validUntil.setMonth(validUntil.getMonth() + 1)
    const pad = n => String(n).padStart(2, '0')
    setValue(
      'valid_until',
      `${validUntil.getFullYear()}-${pad(validUntil.getMonth() + 1)}-${pad(validUntil.getDate())}`,
      { shouldDirty: true }
    )
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

  const checkIsValid = data => ['contact_name', 'issue_date', 'valid_until'].every(key => data[key].length > 0)

  const onSubmit = data => {
    if (checkIsValid(data)) {
      const payload = {
        client_id: clientId || null,
        contact_name: data.contact_name,
        company_name: data.company_name,
        email: data.email,
        phone: data.phone,
        billing_address: data.billing_address,
        status: status || 'draft',
        currency: currency || 'USD',
        issue_date: data.issue_date,
        valid_until: data.valid_until,
        line_items: data.line_items,
        notes: data.notes,
        terms_template_id: templateId || null,
        terms_content: termsContent,
        payment_method_id: paymentMethodId || null,
        payment_method_content: paymentMethodContent,
        tax_rate: taxEnabled ? Number(data.tax_rate) || 0 : 0,
        discount_value: Number(data.discount_value) || 0,
        discount_type: discountType || '$'
      }

      const action = isEdit ? updateQuotation({ id: Number(id), ...payload }) : addQuotation(payload)
      dispatch(action).then(result => {
        toast.success(isEdit ? 'Quotation updated' : 'Quotation added')
        navigate(`/quotation/view/${result.payload.id}`)
      })
    } else {
      for (const key of ['contact_name', 'issue_date', 'valid_until']) {
        if (!data[key] || data[key].length === 0) {
          setError(key, { type: 'manual' })
        }
      }
    }
  }

  const selectedClientOption = clientOptions.find(i => i.value === clientId) || null
  const selectedCurrencyOption = currencyOptions.find(i => i.value === currency) || null
  const selectedDiscountTypeOption = discountTypeOptions.find(i => i.value === discountType) || null

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
              <h6 className='invoice-to-title mb-2'>Service Items</h6>
            </CardBody>
            <LineItemsTable
              control={control}
              fields={fields}
              lineItems={lineItems}
              remove={remove}
              move={move}
              onAddItem={() => append({ description: '', qty: 1, rate: 0 })}
              onOpenCatalog={() => setCatalogOpen(true)}
            />

            <hr className='invoice-spacing' />

            <CardBody>
              <h6 className='invoice-to-title mb-2'>Notes & Terms</h6>
              <Label className='form-label' for='notes'>
                Notes (visible to client)
              </Label>
              <Controller
                name='notes'
                control={control}
                render={({ field }) => <Input type='textarea' rows='2' id='notes' className='mb-2' {...field} />}
              />

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
          </Card>
        </Col>

        <Col lg='4'>
          <div style={{ position: 'sticky', top: '7rem' }}>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Quotation Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Label className='form-label'>Currency</Label>
              <Select
                className='react-select mb-1'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={currencyOptions}
                value={selectedCurrencyOption}
                onChange={option => setValue('currency', option ? option.value : 'USD', { shouldDirty: true })}
              />

              <Label className='form-label' for='issue_date'>
                Issue Date <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='issue_date'
                control={control}
                render={({ field }) => (
                  <DateField
                    id='issue_date'
                    invalid={errors.issue_date && true}
                    className='mb-1'
                    value={field.value}
                    onChange={handleIssueDateChange(field.onChange)}
                  />
                )}
              />

              <Label className='form-label' for='valid_until'>
                Valid Until <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='valid_until'
                control={control}
                render={({ field }) => (
                  <DateField id='valid_until' value={field.value} onChange={field.onChange} invalid={errors.valid_until && true} />
                )}
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
                <span>${formatAmount(subtotal)}</span>
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
                    <span>${formatAmount(taxAmount)}</span>
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
                  value={selectedDiscountTypeOption}
                  onChange={option => setValue('discount_type', option ? option.value : '$', { shouldDirty: true })}
                  styles={{ container: base => ({ ...base, minWidth: '70px' }) }}
                />
              </div>
              <div className='d-flex justify-content-between mb-2'>
                <span>Discount</span>
                <span className='text-success'>-${formatAmount(discountAmount)}</span>
              </div>

              <hr />
              <div className='d-flex justify-content-between mb-2'>
                <h5 className='mb-0'>Total</h5>
                <h5 className='mb-0'>${formatAmount(total)}</h5>
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

export default QuotationForm