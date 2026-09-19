import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'
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
  FormText,
  ListGroup,
  ListGroupItem,
  TabContent,
  TabPane
} from 'reactstrap'
import { Settings, Mail, FileText, Sun, Server } from 'react-feather'
import InputPasswordToggle from '@components/input-password-toggle'
import AdminEmailsTab from './AdminEmailsTab'
import { selectThemeColors } from '@utils'

const encryptionOptions = [
  { value: '', label: 'None' },
  { value: 'ssl', label: 'SSL' },
  { value: 'tls', label: 'TLS' }
]

const syncIntervalOptions = [
  { value: 1, label: 'Every 1 minute' },
  { value: 2, label: 'Every 2 minutes' },
  { value: 5, label: 'Every 5 minutes' },
  { value: 10, label: 'Every 10 minutes' },
  { value: 30, label: 'Every 30 minutes' }
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
  smtp_from_name: '',
  imap_host: '',
  imap_port: '',
  cpanel_host: '',
  cpanel_port: 2083,
  cpanel_username: '',
  cpanel_api_token: '',
  mail_domain: ''
}

const CompanySettings = () => {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab =
    tabParam === 'email'
      ? 'smtp'
      : tabParam === 'pdf'
      ? 'pdf'
      : tabParam === 'weekend'
      ? 'weekend'
      : tabParam === 'mailbox'
      ? 'mailbox'
      : tabParam === 'admin-emails'
      ? 'admin-emails'
      : 'general'
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
  const [imapEncryption, setImapEncryption] = useState('')
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState(1)
  const [weekendSaturday, setWeekendSaturday] = useState(true)
  const [weekendSunday, setWeekendSunday] = useState(true)
  const [cpanelApiTokenSet, setCpanelApiTokenSet] = useState(false)
  const [loading, setLoading] = useState(true)

  const { control, reset, handleSubmit } = useForm({ defaultValues })

  useEffect(() => {
    axios.get('/currencies', { params: { perPage: 100 } }).then(response => {
      const active = response.data.data.currencies.filter(c => c.is_active)
      setCurrencyOptions(active.map(c => ({ value: c.id, label: `${c.name} (${c.icon})` })))
    })

    axios.get('/pdf-designer-templates', { params: { perPage: 100 } }).then(response => {
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
        smtp_from_name: data.smtp_from_name || '',
        imap_host: data.imap_host || '',
        imap_port: data.imap_port ?? '',
        cpanel_host: data.cpanel_host || '',
        cpanel_port: data.cpanel_port ?? 2083,
        cpanel_username: data.cpanel_username || '',
        cpanel_api_token: data.cpanel_api_token || '',
        mail_domain: data.mail_domain || ''
      })
      setTaxEnabled(data.tax_enabled)
      setCurrencyId(data.currency_id || '')
      setInvoicePdfTemplateId(data.invoice_pdf_template_id || '')
      setContractPdfTemplateId(data.contract_pdf_template_id || '')
      setQuotationPdfTemplateId(data.quotation_pdf_template_id || '')
      setSmtpEncryption(data.smtp_encryption || '')
      setImapEncryption(data.imap_encryption || '')
      setSyncIntervalMinutes(data.mailbox_sync_interval_minutes || 1)
      setWeekendSaturday(data.weekend_saturday !== false)
      setWeekendSunday(data.weekend_sunday !== false)
      setCpanelApiTokenSet(data.cpanel_api_token_set)
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
        smtp_from_name: data.smtp_from_name || null,
        imap_host: data.imap_host || null,
        imap_port: data.imap_port === '' ? null : Number(data.imap_port),
        imap_encryption: imapEncryption || null,
        mailbox_sync_interval_minutes: syncIntervalMinutes,
        weekend_saturday: weekendSaturday,
        weekend_sunday: weekendSunday,
        cpanel_host: data.cpanel_host || null,
        cpanel_port: data.cpanel_port === '' ? null : Number(data.cpanel_port),
        cpanel_username: data.cpanel_username || null,
        cpanel_api_token: data.cpanel_api_token,
        mail_domain: data.mail_domain || null
      })
      .then(() => {
        toast.success('Company settings updated')
      })
      .catch(() => toast.error('Failed to update company settings'))
  }

  if (loading) return null

  return (
    <Card className='h-100 mb-0'>
      <style>{`
        .company-settings-sidebar { width: 100%; }
        @media (min-width: 768px) {
          .company-settings-sidebar { width: 260px; flex: 0 0 260px; }
        }
      `}</style>
      <CardHeader>
        <CardTitle tag='h4'>Company Settings</CardTitle>
      </CardHeader>
      <CardBody className='d-flex flex-column flex-grow-1' style={{ minHeight: 0 }}>
        <div className='d-flex flex-column flex-md-row flex-fill' style={{ minHeight: 0 }}>
          <div className='company-settings-sidebar d-flex mb-2 mb-md-0 me-md-2'>
            <div className='border rounded overflow-hidden flex-fill'>
              <ListGroup flush tag='div'>
                <ListGroupItem tag={Link} to='/company' action active={activeTab === 'general'}>
                  <Settings size={16} className='me-75' />
                  <span className='align-middle'>General</span>
                </ListGroupItem>
                <ListGroupItem tag={Link} to='/company?tab=email' action active={activeTab === 'smtp'}>
                  <Mail size={16} className='me-75' />
                  <span className='align-middle'>Email Settings</span>
                </ListGroupItem>
                <ListGroupItem tag={Link} to='/company?tab=pdf' action active={activeTab === 'pdf'}>
                  <FileText size={16} className='me-75' />
                  <span className='align-middle'>PDF Templates</span>
                </ListGroupItem>
                <ListGroupItem tag={Link} to='/company?tab=weekend' action active={activeTab === 'weekend'}>
                  <Sun size={16} className='me-75' />
                  <span className='align-middle'>Weekends</span>
                </ListGroupItem>
                <ListGroupItem tag={Link} to='/company?tab=mailbox' action active={activeTab === 'mailbox'}>
                  <Server size={16} className='me-75' />
                  <span className='align-middle'>Mailbox Provisioning</span>
                </ListGroupItem>
                <ListGroupItem tag={Link} to='/company?tab=admin-emails' action active={activeTab === 'admin-emails'}>
                  <Mail size={16} className='me-75' />
                  <span className='align-middle'>Admin Emails</span>
                </ListGroupItem>
              </ListGroup>
            </div>
          </div>
          <div className='flex-fill' style={{ minWidth: 0 }}>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <TabContent activeTab={activeTab}>
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
              </Row>
            </TabPane>

            <TabPane tabId='pdf'>
              <h6 className='mb-1'>PDF Templates</h6>
              <p className='text-muted small'>
                Which PDF Designer template each document type uses when generating or downloading a PDF.
              </p>
              <Row>
                <Col md={4} className='mb-1'>
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
                <Col md={4} className='mb-1'>
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
                <Col md={4} className='mb-1'>
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

            <TabPane tabId='weekend'>
              <h6 className='mb-1'>Weekend Days</h6>
              <p className='text-muted small mb-2'>
                Same "grey out and block" treatment as a Holiday (see the Holidays settings page) on the Calendar
                and Todo/Kanban due-date pickers, every week instead of a one-time date.
              </p>
              <Row>
                <Col md={12}>
                  <div className='d-flex' style={{ gap: '2rem' }}>
                    <div className='d-flex align-items-center' style={{ gap: '0.5rem' }}>
                      <div className='form-switch'>
                        <Input
                          type='switch'
                          id='weekend_saturday'
                          checked={weekendSaturday}
                          onChange={e => setWeekendSaturday(e.target.checked)}
                        />
                      </div>
                      <Label className='form-label mb-0' htmlFor='weekend_saturday'>
                        Saturday
                      </Label>
                    </div>
                    <div className='d-flex align-items-center' style={{ gap: '0.5rem' }}>
                      <div className='form-switch'>
                        <Input
                          type='switch'
                          id='weekend_sunday'
                          checked={weekendSunday}
                          onChange={e => setWeekendSunday(e.target.checked)}
                        />
                      </div>
                      <Label className='form-label mb-0' htmlFor='weekend_sunday'>
                        Sunday
                      </Label>
                    </div>
                  </div>
                </Col>
              </Row>
            </TabPane>

            <TabPane tabId='mailbox'>
              <h6 className='mb-1'>Mailbox Provisioning</h6>
              <p className='text-muted small'>
                Lets the User form take just a mailbox name (e.g. "dhruvit") instead of a full address, and
                creates the real mailbox on your mail server automatically via cPanel - no need to go into cPanel
                by hand. Changing a user's mailbox password from the User form also updates the real mailbox's
                password to match. Requires a cPanel API token: in cPanel, go to <em>Security &rarr; Manage API
                Tokens</em>, create one, and paste it below. Leave this whole section empty to keep the User
                form's plain email field instead.
              </p>
              <Row>
                <Col md={4} className='mb-1'>
                  <Label className='form-label' for='mail_domain'>
                    Mailbox Domain
                  </Label>
                  <Controller
                    name='mail_domain'
                    control={control}
                    render={({ field }) => <Input id='mail_domain' placeholder='veztraa.com' {...field} />}
                  />
                  <p className='text-muted small mb-0 mt-25'>Appended to every mailbox name the User form creates.</p>
                </Col>
                <Col md={5} className='mb-1'>
                  <Label className='form-label' for='cpanel_host'>
                    cPanel Host
                  </Label>
                  <Controller
                    name='cpanel_host'
                    control={control}
                    render={({ field }) => <Input id='cpanel_host' placeholder='server.yourhost.com' {...field} />}
                  />
                </Col>
                <Col md={3} className='mb-1'>
                  <Label className='form-label' for='cpanel_port'>
                    Port
                  </Label>
                  <Controller
                    name='cpanel_port'
                    control={control}
                    render={({ field }) => <Input type='number' step='1' min='0' id='cpanel_port' placeholder='2083' {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='cpanel_username'>
                    cPanel Account Username
                  </Label>
                  <Controller
                    name='cpanel_username'
                    control={control}
                    render={({ field }) => <Input id='cpanel_username' placeholder='veztraa' {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <Label className='form-label' for='cpanel_api_token'>
                    cPanel API Token
                  </Label>
                  <Controller
                    name='cpanel_api_token'
                    control={control}
                    render={({ field }) => (
                      <InputPasswordToggle
                        id='cpanel_api_token'
                        placeholder={cpanelApiTokenSet ? 'Leave blank to keep the current token' : 'Paste API token'}
                        autoComplete='new-password'
                        {...field}
                      />
                    )}
                  />
                  <FormText color='muted'>The eye icon reveals the real, current token - same as a mailbox password on the User form.</FormText>
                </Col>
              </Row>
            </TabPane>

            <TabPane tabId='admin-emails'>
              <AdminEmailsTab />
            </TabPane>

            <TabPane tabId='smtp'>
              <h6 className='mb-1'>Incoming Mail (IMAP)</h6>
              <p className='text-muted small'>
                Used to let each user read their own mailbox in the Email app - see their own login under
                User &rarr; Email Settings.
              </p>
              <Row>
                <Col md={8} className='mb-1'>
                  <Label className='form-label' for='imap_host'>
                    IMAP Host
                  </Label>
                  <Controller
                    name='imap_host'
                    control={control}
                    render={({ field }) => <Input id='imap_host' placeholder='imap.veztraa.com' {...field} />}
                  />
                </Col>
                <Col md={4} className='mb-1'>
                  <Label className='form-label' for='imap_port'>
                    Port
                  </Label>
                  <Controller
                    name='imap_port'
                    control={control}
                    render={({ field }) => <Input type='number' step='1' min='0' id='imap_port' placeholder='993' {...field} />}
                  />
                </Col>
                <Col md={4} className='mb-1'>
                  <Label className='form-label' for='imap_encryption'>
                    Encryption
                  </Label>
                  <Select
                    inputId='imap_encryption'
                    className='react-select'
                    classNamePrefix='select'
                    theme={selectThemeColors}
                    options={encryptionOptions}
                    value={encryptionOptions.find(i => i.value === imapEncryption)}
                    onChange={option => setImapEncryption(option ? option.value : '')}
                    isSearchable={false}
                  />
                </Col>
              </Row>

              <hr className='my-2' />

              <h6 className='mb-1'>Mailbox Sync</h6>
              <p className='text-muted small'>
                The Email app always shows mail from a local, instantly-loading cache instead of connecting to
                the mail server on every page view. A scheduled job keeps that cache fresh - set it up once on
                your hosting's cron/scheduled-task feature (e.g. cPanel's <em>Cron Jobs</em>) to run:
              </p>
              <p className='text-muted small'>
                <code>php /path/to/veztraa-api/cron/sync-mailboxes.php</code> every 1-2 minutes.
              </p>
              <p className='text-muted small'>
                A second job, <code>php /path/to/veztraa-api/cron/process-outbox.php</code>, should run on the
                same schedule - normal sends don't depend on it (they go out immediately), but{' '}
                <strong>Schedule Send</strong> in Compose does: a scheduled email only actually goes out once this
                job notices its time has arrived.
              </p>
              <Row>
                <Col md={4} className='mb-1'>
                  <Label className='form-label' for='mailbox_sync_interval_minutes'>
                    Sync Interval
                  </Label>
                  <Select
                    inputId='mailbox_sync_interval_minutes'
                    className='react-select'
                    classNamePrefix='select'
                    theme={selectThemeColors}
                    options={syncIntervalOptions}
                    value={syncIntervalOptions.find(i => i.value === syncIntervalMinutes)}
                    onChange={option => setSyncIntervalMinutes(option ? option.value : 1)}
                    isSearchable={false}
                  />
                  <p className='text-muted small mb-0 mt-25'>
                    How often each user's Inbox is actually refreshed from the mail server. The cron job itself
                    can run more often than this - it skips anyone not due yet.
                  </p>
                </Col>
              </Row>

              <hr className='my-2' />

              <h6 className='mb-1'>Outgoing Mail (SMTP)</h6>
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
                <Col md={12}>
                  <p className='text-muted small mb-0'>
                    Login for outgoing mail also comes from each user's own Email Settings - a separate,
                    dedicated section will cover transactional system email (invoice/quotation notifications,
                    password resets, etc.).
                  </p>
                </Col>
              </Row>
            </TabPane>
          </TabContent>
        </Form>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default CompanySettings