// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'

// ** Utils
import { selectThemeColors } from '@utils'

const defaultValues = {
  legal_name: '',
  address: '',
  default_tax_rate: 0,
  default_due_days: ''
}

const CompanySettings = () => {
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [currencyId, setCurrencyId] = useState('')
  const [invoicePdfTemplateId, setInvoicePdfTemplateId] = useState('')
  const [contractPdfTemplateId, setContractPdfTemplateId] = useState('')
  const [quotationPdfTemplateId, setQuotationPdfTemplateId] = useState('')
  const [currencyOptions, setCurrencyOptions] = useState([])
  const [invoicePdfOptions, setInvoicePdfOptions] = useState([])
  const [contractPdfOptions, setContractPdfOptions] = useState([])
  const [quotationPdfOptions, setQuotationPdfOptions] = useState([])
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
        default_due_days: data.default_due_days ?? ''
      })
      setTaxEnabled(data.tax_enabled)
      setCurrencyId(data.currency_id || '')
      setInvoicePdfTemplateId(data.invoice_pdf_template_id || '')
      setContractPdfTemplateId(data.contract_pdf_template_id || '')
      setQuotationPdfTemplateId(data.quotation_pdf_template_id || '')
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
        quotation_pdf_template_id: quotationPdfTemplateId || null
      })
      .then(() => toast.success('Company settings updated'))
      .catch(() => toast.error('Failed to update company settings'))
  }

  if (loading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>Company Settings</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
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
        </Form>
      </CardBody>
    </Card>
  )
}

export default CompanySettings
