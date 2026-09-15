// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'

// ** Reactstrap Imports
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Row,
  Col,
  Form,
  Label,
  Input,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  FormText
} from 'reactstrap'

// ** Third Party Icons
import { Settings, Mail } from 'react-feather'

// ** Utils
import { selectThemeColors } from '@utils'

const encryptionOptions = [
  { value: '', label: 'None' },
  { value: 'ssl', label: 'SSL' },
  { value: 'tls', label: 'TLS' }
]

const defaultValues = {
  legal_name: '',
  address: '',
  default_tax_rate: 0,
  default_due_days: '',
  smtp_host: '',
  smtp_port: '',
  smtp_username: '',
  smtp_password: '',
  smtp_from_email: '',
  smtp_from_name: ''
}

const CompanySettings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [currencyId, setCurrencyId] = useState('')
  const [invoicePdfTemplateId, setInvoicePdfTemplateId] = useState('')
  const [contractPdfTemplateId, setContractPdfTemplateId] = useState('')
  const [quotationPdfTemplateId, setQuotationPdfTemplateId] = useState('')
  const [currencyOptions, setCurrencyOptions] = useState([])
  const [invoicePdfOptions, setInvoicePdfOptions] = useState([])
  const [contractPdfOptions, setContractPdfOptions] = useState([])
  const [quotationPdfOptions, setQuotationPdfOptions] = useState([])
  const [smtpEncryption, setSmtpEncryption] = useState('')
  const [smtpPasswordSet, setSmtpPasswordSet] = useState(false)
  const [loading, setLoading] = useState(true)

  const { control, reset, handleSubmit } = useForm({ defaultValues })

  // ** Fetch currencies and PDF templates for the selects
  useEffect(() => {
    axios.get('/currencies', { params: { perPage: 100 } }).then(response => {
      const active = response.data.data.currencies.filter(c => c.is_active)
      setCurrencyOptions(active.map(c => ({ value: c.id, label: `${c.name} (${c.icon})` })))
    })

    axios.get('/pdf-designer-templates', { params: { perPage: 100 } }).then(response => {
      // Any active template can be picked for any of the three slots below -
      // the template's own "type" tag isn't used to narrow these lists.
      const options = response.data.data.pdfDesignerTemplates
        .filter(t => t.is_active)
        .map(t => ({ value: t.id, label: t.name }))
      setInvoicePdfOptions(options)
      setContractPdfOptions(options)
      setQuotationPdfOptions(options)
    })
  }, [])

  useEffect(() => {
    axios.get('/company').then(response => {
      const data = response.data.data
      reset({
        legal_name: data.legal_name || '',
        address: data.address || '',
        default_tax_rate: data.default_tax_rate || 0,
        default_due_days: data.default_due_days ?? '',
        smtp_host: data.smtp_host || '',
        smtp_port: data.smtp_port ?? '',
        smtp_username: data.smtp_username || '',
        smtp_password: '',
        smtp_from_email: data.smtp_from_email || '',
        smtp_from_name: data.smtp_from_name || ''
      })
      setTaxEnabled(data.tax_enabled)
      setCurrencyId(data.currency_id || '')
      setInvoicePdfTemplateId(data.invoice_pdf_template_id || '')
      setContractPdfTemplateId(data.contract_pdf_template_id || '')
      setQuotationPdfTemplateId(data.quotation_pdf_template_id || '')
      setSmtpEncryption(data.smtp_encryption || '')
      setSmtpPasswordSet(data.smtp_password_set)
      setLoading(false)
    })
  }, [])

  const onSubmit = data => {
    axios
      .put('/company', {
        legal_name: data.legal_name,
        currency_id: currencyId || null,
        address: data.address,
        tax_enabled: taxEnabled,
        default_tax_rate: Number(data.default_tax_rate) || 0,
        default_due_days: data.default_due_days === '' ? null : Number(data.default_due_days),
        invoice_pdf_template_id: invoicePdfTemplateId || null,
        contract_pdf_template_id: contractPdfTemplateId || null,
        quotation_pdf_template_id: quotationPdfTemplateId || null,
        smtp_host: data.smtp_host || null,
        smtp_port: data.smtp_port === '' ? null : Number(data.smtp_port),
        smtp_username: data.smtp_username || null,
        smtp_password: data.smtp_password,
        smtp_encryption: smtpEncryption || null,
        smtp_from_email: data.smtp_from_email || null,
        smtp_from_name: data.smtp_from_name || null
      })
      .then(() => {
        toast.success('Company settings updated')
        if (data.smtp_password) setSmtpPasswordSet(true)
      })
      .catch(() => toast.error('Failed to update company settings'))
  }

  if (loading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>Company Settings</CardTitle>
      </CardHeader>
      <CardBody>
        <Nav tabs>
          <NavItem>
            <NavLink active={activeTab === 'general'} onClick={() => setActiveTab('general')} style={{ cursor: 'pointer' }}>
              <Settings size={14} className='me-50' />
              General
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink active={activeTab === 'smtp'} onClick={() => setActiveTab('smtp')} style={{ cursor: 'pointer' }}>
              <Mail size={14} className='me-50' />
              SMTP Settings
            </NavLink>
          </NavItem>
        </Nav>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <TabContent activeTab={activeTab} className='pt-2'>
            <TabPane tabId='general'>
              <Row>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='legal_name'>
                    Company Legal Name
                  </Label>
                  <Controller
                    name='legal_name'
                    control={control}
                    render={({ field }) => <Input id='legal_name' placeholder='Veztraa Solutions Pvt. Ltd.' {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='currency_id'>
                    Default Currency
                  </Label>
                  <Select
                    inputId='currency_id'
                    isClearable
                    className='react-select'
                    classNamePrefix='select'
                    theme={selectThemeColors}
                    options={currencyOptions}
                    value={currencyOptions.find(i => i.value === currencyId) || null}
                    onChange={option => setCurrencyId(option ? option.value : '')}
                    placeholder='Select currency...'
                  />
                </Col>
                <Col md={12} className='mb-1'>
                  <Label className='form-label' for='address'>
                    Company Address
                  </Label>
                  <Controller
                    name='address'
                    control={control}
                    render={({ field }) => (
                      <Input type='textarea' rows='3' id='address' placeholder='123 Business Park, Ahmedabad, India' {...field} />
                    )}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='default_due_days'>
                    Default Invoice Due (Days)
                  </Label>
                  <Controller
                    name='default_due_days'
                    control={control}
                    render={({ field }) => (
                      <Input type='number' step='1' min='0' id='default_due_days' placeholder='e.g. 15' {...field} />
                    )}
                  />
                  <p className='text-muted small mb-0 mt-25'>
                    When set, the Invoice form auto-fills the due date this many days after the issue date.
                  </p>
                </Col>
                <Col md={12} className='mb-1'>
                  <div className='d-flex justify-content-between align-items-center'>
                    <Label className='form-label mb-0' htmlFor='tax_enabled'>
                      Enable Tax
                    </Label>
                    <div className='form-switch'>
                      <Input type='switch' id='tax_enabled' checked={taxEnabled} onChange={e => setTaxEnabled(e.target.checked)} />
                    </div>
                  </div>
                </Col>
                {taxEnabled && (
                  <>
                    <Col md={4} className='mb-1'>
                      <Label className='form-label' for='default_tax_rate'>
                        Default Tax Rate (%)
                      </Label>
                      <Controller
                        name='default_tax_rate'
                        control={control}
                        render={({ field }) => <Input type='number' step='0.01' min='0' id='default_tax_rate' {...field} />}
                      />
                    </Col>
                    <Col md={8} />
                  </>
                )}
                <Col md={4}>
                  <Label className='form-label' for='invoice_pdf_template_id'>
                    Invoice PDF
                  </Label>
                  <Select
                    inputId='invoice_pdf_template_id'
                    isClearable
                    className='react-select'
                    classNamePrefix='select'
                    theme={selectThemeColors}
                    options={invoicePdfOptions}
                    value={invoicePdfOptions.find(i => i.value === invoicePdfTemplateId) || null}
                    onChange={option => setInvoicePdfTemplateId(option ? option.value : '')}
                    placeholder='Select PDF template...'
                  />
                </Col>
                <Col md={4}>
                  <Label className='form-label' for='contract_pdf_template_id'>
                    Contract PDF
                  </Label>
                  <Select
                    inputId='contract_pdf_template_id'
                    isClearable
                    className='react-select'
                    classNamePrefix='select'
                    theme={selectThemeColors}
                    options={contractPdfOptions}
                    value={contractPdfOptions.find(i => i.value === contractPdfTemplateId) || null}
                    onChange={option => setContractPdfTemplateId(option ? option.value : '')}
                    placeholder='Select PDF template...'
                  />
                </Col>
                <Col md={4}>
                  <Label className='form-label' for='quotation_pdf_template_id'>
                    Quotation PDF
                  </Label>
                  <Select
                    inputId='quotation_pdf_template_id'
                    isClearable
                    className='react-select'
                    classNamePrefix='select'
                    theme={selectThemeColors}
                    options={quotationPdfOptions}
                    value={quotationPdfOptions.find(i => i.value === quotationPdfTemplateId) || null}
                    onChange={option => setQuotationPdfTemplateId(option ? option.value : '')}
                    placeholder='Select PDF template...'
                  />
                </Col>
              </Row>
            </TabPane>

            <TabPane tabId='smtp'>
              <Row>
                <Col md={8} className='mb-1'>
                  <Label className='form-label' for='smtp_host'>
                    SMTP Host
                  </Label>
                  <Controller
                    name='smtp_host'
                    control={control}
                    render={({ field }) => <Input id='smtp_host' placeholder='smtp.gmail.com' {...field} />}
                  />
                </Col>
                <Col md={4} className='mb-1'>
                  <Label className='form-label' for='smtp_port'>
                    Port
                  </Label>
                  <Controller
                    name='smtp_port'
                    control={control}
                    render={({ field }) => <Input type='number' step='1' min='0' id='smtp_port' placeholder='587' {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='smtp_username'>
                    Username
                  </Label>
                  <Controller
                    name='smtp_username'
                    control={control}
                    render={({ field }) => <Input id='smtp_username' placeholder='no-reply@veztraa.com' {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='smtp_password'>
                    Password
                  </Label>
                  <Controller
                    name='smtp_password'
                    control={control}
                    render={({ field }) => (
                      <Input
                        type='password'
                        id='smtp_password'
                        placeholder={smtpPasswordSet ? '••••••••' : 'SMTP password'}
                        autoComplete='new-password'
                        {...field}
                      />
                    )}
                  />
                  <FormText color='muted'>
                    {smtpPasswordSet ? 'Leave blank to keep the current password' : 'Not set yet'}
                  </FormText>
                </Col>
                <Col md={4} className='mb-1'>
                  <Label className='form-label' for='smtp_encryption'>
                    Encryption
                  </Label>
                  <Select
                    inputId='smtp_encryption'
                    className='react-select'
                    classNamePrefix='select'
                    theme={selectThemeColors}
                    options={encryptionOptions}
                    value={encryptionOptions.find(i => i.value === smtpEncryption)}
                    onChange={option => setSmtpEncryption(option ? option.value : '')}
                    isSearchable={false}
                  />
                </Col>
                <Col md={4} className='mb-1'>
                  <Label className='form-label' for='smtp_from_email'>
                    From Email
                  </Label>
                  <Controller
                    name='smtp_from_email'
                    control={control}
                    render={({ field }) => <Input type='email' id='smtp_from_email' placeholder='billing@veztraa.com' {...field} />}
                  />
                </Col>
                <Col md={4} className='mb-1'>
                  <Label className='form-label' for='smtp_from_name'>
                    From Name
                  </Label>
                  <Controller
                    name='smtp_from_name'
                    control={control}
                    render={({ field }) => <Input id='smtp_from_name' placeholder='Veztraa Solutions' {...field} />}
                  />
                </Col>
                <Col md={12}>
                  <p className='text-muted small mb-0'>
                    These credentials are used for outgoing email (invoice/quotation notifications, password resets, etc.).
                  </p>
                </Col>
              </Row>
            </TabPane>
          </TabContent>
        </Form>
      </CardBody>
    </Card>
  )
}

export default CompanySettings
