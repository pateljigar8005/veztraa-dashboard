import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Card, CardHeader, CardTitle, CardBody, Form, Label, Input } from 'reactstrap'
import { selectThemeColors, formatAmount, sortOptions, clientOptionLabel, convertFromUsd } from '@utils'
import CatalogModal from '../../shared/CatalogModal'
import TermsSection from '../../shared/TermsSection'
import PaymentMethodSection from '../../shared/PaymentMethodSection'
import LineItemsTable from '../../shared/LineItemsTable'
import DateField from '../../shared/DateField'
import AmountField from '../../shared/AmountField'
import { addInvoice, updateInvoice, getInvoice } from '../store'
import SourceReference from '../SourceReference'
import { discountTypeOptions } from '../../quotation/documentOptions'
import { invoiceableContractStatuses } from '../../contract/contractOptions'
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/base/pages/app-invoice.scss'

// YYYY-MM-DD + N days, done on the date parts directly - new Date(str)
// parses as UTC and can shift the day in some timezones.
const addDays = (value, days) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (days === null || days === undefined || !match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (isNaN(date.getTime())) return null
  date.setDate(date.getDate() + Number(days))
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Today as local YYYY-MM-DD - toISOString() is UTC, which is still
// yesterday in India until 05:30.
const localToday = () => {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const defaultValues = {
  contact_name: '',
  company_name: '',
  email: '',
  phone: '',
  billing_address: '',
  issue_date: localToday(),
  due_date: '',
  status: 'draft',
  tax_rate: 0,
  discount_value: 0,
  line_items: [{ description: '', qty: 1, rate: 0 }]
}


const InvoiceForm = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const preselectedClientId = searchParams.get('client_id')
  const cloneId = searchParams.get('clone')
  // "Convert to Invoice" on a quotation / "Create Invoice" on a contract
  // (see quotation/view and contract/view) - pre-fills this form from that
  // record and links the new invoice back to it.
  const fromQuotationId = searchParams.get('from_quotation')
  const fromContractId = searchParams.get('from_contract')
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.invoice)

  const [clientOptions, setClientOptions] = useState([])
  const [currencyOptions, setCurrencyOptions] = useState([])
  const [currencyRates, setCurrencyRates] = useState({})
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([])
  const [templateOptions, setTemplateOptions] = useState([])
  const [termsContent, setTermsContent] = useState('')
  const [paymentMethodContent, setPaymentMethodContent] = useState('')
  const [extraDirty, setExtraDirty] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [defaultDueDays, setDefaultDueDays] = useState(null)
  // { quotation_id, quotation_number, quotation_exists, contract_id, ... } -
  // the same shape InvoiceController::serialize() returns, whichever of
  // edit/clone/convert filled it in.
  const [source, setSource] = useState({})

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
        sortOptions(
          response.data.data.clients.map(c => ({
            value: c.id,
            label: clientOptionLabel(c),
            contact_name: c.fullName,
            company_name: c.company_name,
            email: c.email,
            phone: c.phone,
            address: c.address,
            currency_icon: c.currency_icon
          }))
        )
      )
    })
    axios.get('/currencies', { params: { perPage: 100 } }).then(response => {
      const currencies = response.data.data.currencies
      setCurrencyOptions(
        sortOptions(
          currencies.filter(c => c.is_active).map(c => ({ value: c.icon, label: `${c.name} (${c.icon})` }))
        )
      )
      setCurrencyRates(Object.fromEntries(currencies.map(c => [c.icon, Number(c.rate)])))
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
    axios.get('/terms-templates', { params: { perPage: 100 } }).then(response => {
      setTemplateOptions(sortOptions(response.data.data.termsTemplates.map(t => ({ value: t.id, label: t.name, content: t.content }))))
    })
    axios.get('/company').then(response => {
      setTaxEnabled(!!response.data.data.tax_enabled)
      setDefaultDueDays(response.data.data.default_due_days)
    })
  }, [])

  useEffect(() => {
    if (!isEdit && preselectedClientId) {
      setValue('client_id', Number(preselectedClientId))
    }
  }, [preselectedClientId])

  useEffect(() => {
    if (isEdit) dispatch(getInvoice(id))
    else if (cloneId) dispatch(getInvoice(cloneId))
  }, [id, cloneId])

  // Convert a quotation: everything billable carries over (line items,
  // currency, tax, discount, terms, payment method). The issue date resets
  // to today - the invoice is being raised now, not when it was quoted.
  useEffect(() => {
    if (isEdit || !fromQuotationId) return
    axios
      .get(`/quotations/${fromQuotationId}`)
      .then(response => {
        const q = response.data.data
        reset({
          ...defaultValues,
          contact_name: q.contact_name || '',
          company_name: q.company_name || '',
          email: q.email || '',
          phone: q.phone || '',
          billing_address: q.billing_address || '',
          tax_rate: q.tax_rate || 0,
          discount_value: q.discount_value || 0,
          line_items: q.line_items && q.line_items.length ? q.line_items : defaultValues.line_items
        })
        setValue('client_id', q.client_id || '')
        setValue('status', 'draft')
        setValue('currency', q.currency || 'USD')
        setValue('payment_method_id', q.payment_method_id || '')
        setValue('terms_template_id', q.terms_template_id || '')
        setValue('discount_type', q.discount_type || '$')
        setTermsContent(q.terms_content || '')
        setPaymentMethodContent(q.payment_method_content || '')
        setSource({ quotation_id: q.id, quotation_number: q.quotation_number, quotation_exists: true })
        setExtraDirty(true)
      })
      .catch(() => toast.error('Could not load that quotation'))
  }, [fromQuotationId])

  // Invoice under a contract: everything billable carries over (line items,
  // currency, tax, discount, terms, payment method) same as converting a
  // quotation above - a contract's own line items are the default billing
  // for each occurrence, editable per-invoice before sending.
  useEffect(() => {
    if (isEdit || !fromContractId) return
    axios
      .get(`/contracts/${fromContractId}`)
      .then(response => {
        const ct = response.data.data
        // Also enforced server-side - this just says so up front instead of
        // only once the user has filled the whole form in and hit Save.
        if (!invoiceableContractStatuses.includes(ct.status)) {
          toast.error('This contract is not Active or Signed yet - the invoice will be rejected on save')
        }
        reset({
          ...defaultValues,
          contact_name: ct.contact_name || '',
          company_name: ct.company_name || '',
          email: ct.email || '',
          phone: ct.phone || '',
          billing_address: ct.billing_address || '',
          tax_rate: ct.tax_rate || 0,
          discount_value: ct.discount_value || 0,
          line_items: ct.line_items && ct.line_items.length ? ct.line_items : defaultValues.line_items
        })
        setValue('client_id', ct.client_id || '')
        setValue('status', 'draft')
        setValue('currency', ct.currency || 'USD')
        setValue('payment_method_id', ct.payment_method_id || '')
        setValue('terms_template_id', ct.terms_template_id || '')
        setValue('discount_type', ct.discount_type || '$')
        setTermsContent(ct.terms_content || '')
        setPaymentMethodContent(ct.payment_method_content || '')
        setSource({ contract_id: ct.id, contract_number: ct.contract_number, contract_exists: true })
        setExtraDirty(true)
      })
      .catch(() => toast.error('Could not load that contract'))
  }, [fromContractId])

  // A converted invoice starts with today's issue date but no due date -
  // fill it from Company Settings' default due days once that has loaded,
  // same as picking an issue date by hand would.
  useEffect(() => {
    if (isEdit || (!fromQuotationId && !fromContractId) || (!source.quotation_id && !source.contract_id)) return
    const due = addDays(defaultValues.issue_date, defaultDueDays)
    if (due) setValue('due_date', due)
  }, [source, defaultDueDays])

  useEffect(() => {
    const sourceId = isEdit ? Number(id) : Number(cloneId)
    if (sourceId && store.selectedInvoice && store.selectedInvoice.id === sourceId) {
      const inv = store.selectedInvoice
      // Every field goes into reset() so the loaded values become the form's
      // baseline - setting some afterwards with setValue() left them differing
      // from the defaults and the untouched form counted as dirty.
      reset({
        contact_name: inv.contact_name || '',
        company_name: inv.company_name || '',
        email: inv.email || '',
        phone: inv.phone || '',
        billing_address: inv.billing_address || '',
        issue_date: inv.issue_date || '',
        due_date: inv.due_date || '',
        tax_rate: inv.tax_rate || 0,
        discount_value: inv.discount_value || 0,
        line_items: inv.line_items && inv.line_items.length ? inv.line_items : [{ description: '', qty: 1, rate: 0 }],
        client_id: inv.client_id || '',
        status: inv.status || 'draft',
        currency: inv.currency || 'USD',
        payment_method_id: inv.payment_method_id || '',
        terms_template_id: inv.terms_template_id || '',
        discount_type: inv.discount_type || '$'
      })
      setTermsContent(inv.terms_content || '')
      setPaymentMethodContent(inv.payment_method_content || '')
      // A clone keeps the original's link too - e.g. next month's invoice
      // cloned from this month's still belongs to the same contract.
      setSource({
        quotation_id: inv.quotation_id,
        quotation_number: inv.quotation_number,
        quotation_exists: inv.quotation_exists,
        contract_id: inv.contract_id,
        contract_number: inv.contract_number,
        contract_exists: inv.contract_exists
      })
    }
  }, [store.selectedInvoice])

  const handleQuickFill = option => {
    setValue('client_id', option ? option.value : '', { shouldDirty: true })
    if (option) {
      setValue('contact_name', option.contact_name, { shouldDirty: true })
      setValue('company_name', option.company_name || '', { shouldDirty: true })
      setValue('email', option.email || '', { shouldDirty: true })
      setValue('phone', option.phone || '', { shouldDirty: true })
      setValue('billing_address', option.address || '', { shouldDirty: true })
      if (option.currency_icon) setValue('currency', option.currency_icon, { shouldDirty: true })
    }
  }

  const handleIssueDateChange = onChange => value => {
    onChange(value)
    const due = addDays(value, defaultDueDays)
    if (due) setValue('due_date', due, { shouldDirty: true })
  }

  const handleAddFromCatalog = items => {
    if (lineItems.length === 1 && !lineItems[0].description) {
      remove(0)
    }
    items.forEach(item =>
      append({ description: item.name, qty: 1, rate: convertFromUsd(item.price, currency, currencyRates) })
    )
  }

  const subtotal = (lineItems || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0)
  const taxAmount = taxEnabled ? subtotal * ((Number(taxRate) || 0) / 100) : 0
  const discountAmount =
    discountType === '%' ? subtotal * ((Number(discountValue) || 0) / 100) : Number(discountValue) || 0
  const total = subtotal + taxAmount - discountAmount

  const checkIsValid = data => ['contact_name', 'issue_date', 'due_date'].every(key => data[key].length > 0)

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
        due_date: data.due_date,
        line_items: data.line_items,
        terms_template_id: templateId || null,
        terms_content: termsContent,
        payment_method_id: paymentMethodId || null,
        payment_method_content: paymentMethodContent,
        tax_rate: taxEnabled ? Number(data.tax_rate) || 0 : 0,
        discount_value: Number(data.discount_value) || 0,
        discount_type: discountType || '$'
      }
      // Only set on create - an edit never re-points an existing invoice
      // at a different quotation/contract (Invoice::update() leaves columns
      // it isn't sent alone).
      if (!isEdit) {
        payload.quotation_id = source.quotation_id || null
        payload.contract_id = source.contract_id || null
      }

      const action = isEdit ? updateInvoice({ id: Number(id), ...payload }) : addInvoice(payload)
      dispatch(action)
        .unwrap()
        .then(invoice => {
          toast.success(isEdit ? 'Invoice updated' : 'Invoice added')
          navigate(`/invoice/view/${invoice.id}`)
        })
        .catch(err => toast.error(err?.message || 'Failed to save invoice'))
    } else {
      for (const key of ['contact_name', 'issue_date', 'due_date']) {
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
    <div className='invoice-add-wrapper'>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row className='invoice-add'>
          <Col xl={9} md={8} sm={12}>
            <Card className='invoice-preview-card'>
              {                       }
              <CardBody className='invoice-padding'>
                <Row className='row-bill-to invoice-spacing'>
                  <Col className='col-bill-to ps-0' xl='12'>
                    <h6 className='invoice-to-title'>Bill To:</h6>
                    <Label className='form-label small mb-50'>⚡ Quick Fill Customer</Label>
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
                      <Col md={12}>
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
                  </Col>
                </Row>
              </CardBody>
              {              }

              {                     }
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
              {                      }

              <hr className='invoice-spacing mt-0' />

              {                          }
              <CardBody className='invoice-padding py-0'>
                <Row>
                  <Col>
                    <div className='mb-2'>
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
                    </div>
                    <div className='mb-2'>
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
                    </div>
                  </Col>
                </Row>
              </CardBody>
              {                           }
            </Card>
          </Col>

          <Col xl={3} md={4} sm={12}>
            <div style={{ position: 'sticky', top: '7rem' }}>
              <Card>
                <CardHeader>
                  <CardTitle tag='h4'>Invoice Details</CardTitle>
                </CardHeader>
                <CardBody>
                  {(source.quotation_id || source.contract_id) && (
                    <div className='mb-1'>
                      <Label className='form-label'>Created From</Label>
                      <div>
                        <SourceReference invoice={source} />
                      </div>
                    </div>
                  )}
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
                    Issue Date
                  </Label>
                  <Controller
                    name='issue_date'
                    control={control}
                    render={({ field }) => (
                      <DateField
                        id='issue_date'
                        className='mb-1'
                        invalid={errors.issue_date && true}
                        value={field.value}
                        onChange={handleIssueDateChange(field.onChange)}
                      />
                    )}
                  />

                  <Label className='form-label' for='due_date'>
                    Due Date
                  </Label>
                  <Controller
                    name='due_date'
                    control={control}
                    render={({ field }) => (
                      <DateField id='due_date' value={field.value} onChange={field.onChange} invalid={errors.due_date && true} />
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
                      value={selectedDiscountTypeOption}
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
    </div>
  )
}

export default InvoiceForm