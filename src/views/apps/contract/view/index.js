// ** React Imports
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useDispatch, useSelector } from 'react-redux'
import { Edit2, ChevronDown, ChevronRight } from 'react-feather'
import { pdf, ReportDocument } from '@veztraa/report-renderer'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Label, Button, Collapse } from 'reactstrap'

// ** Store & Actions
import { getContract, updateContract } from '../store'

// ** Options
import { frequencyOptions, contractStatusOptions } from '../contractOptions'

// ** Utils
import { selectThemeColors } from '@utils'
import { currentUserCan } from '@src/utility/navPermissions'

const frequencyLabel = value => frequencyOptions.find(i => i.value === value)?.label || value || '-'

// ** Maps a contract's fields onto the field paths the selected PDF template
// binds to. The "Agreement PDF (Draft)" template currently in PDF Designer
// still carries the pricing/line-item bindings it was cloned from (Contracts
// don't track amounts), so those are sent as zero/empty here - editing that
// template to bind a "body" richtext element is what would make the
// generated PDF show the actual agreement text.
// document.{start_date,end_date} rather than {issue_date,due_date} - a
// contract runs for a PERIOD, not issued-then-due like an invoice/quotation,
// so it gets its own date field names within the shared "document" shape.
const buildPdfData = contract => ({
  client: {
    name: contract.contact_name || '',
    company: contract.company_name || '',
    email: contract.email || '',
    phone: contract.phone || '',
    address: contract.billing_address || ''
  },
  document: {
    number: contract.contract_number,
    start_date: contract.start_date,
    end_date: contract.end_date
  },
  frequency: frequencyLabel(contract.frequency),
  currency: '',
  tax_rate: 0,
  tax_amount: 0,
  discount_amount: 0,
  total: '0.00',
  terms_conditions: contract.terms_content || '',
  payment_method: contract.payment_method_content || '',
  body: contract.body || '',
  service_items: []
})

const ContractView = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const store = useSelector(state => state.contracts)

  const [termsOpen, setTermsOpen] = useState(false)
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false)
  const [pdfTemplate, setPdfTemplate] = useState(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    dispatch(getContract(id))
  }, [id])

  useEffect(() => {
    axios.get('/company').then(response => {
      const templateId = response.data.data.contract_pdf_template_id
      if (!templateId) return
      axios.get(`/pdf-designer-templates/${templateId}`).then(templateResponse => {
        setPdfTemplate(templateResponse.data.data.template)
      })
    })
  }, [])

  const contract = store.selectedContract

  useEffect(() => {
    if (!contract || !pdfTemplate) {
      setPreviewUrl(null)
      return
    }

    let cancelled = false
    let objectUrl = null
    setPreviewLoading(true)

    pdf(<ReportDocument template={pdfTemplate} data={buildPdfData(contract)} />)
      .toBlob()
      .then(blob => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
      })
      .catch(() => { })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [contract, pdfTemplate])

  const handleStatusChange = option => {
    if (!option) return
    dispatch(updateContract({ id: Number(id), contract: { status: option.value } })).then(() => {
      dispatch(getContract(id))
      toast.success('Status updated')
    })
  }

  if (!contract || contract.id !== Number(id)) {
    return null
  }

  const selectedStatusOption = contractStatusOptions.find(i => i.value === contract.status) || null

  const handleDownloadPdf = async () => {
    if (!pdfTemplate) {
      toast.error('No contract PDF template is selected in Company Settings.')
      return
    }

    setGeneratingPdf(true)
    try {
      let url = previewUrl
      if (!url) {
        const blob = await pdf(<ReportDocument template={pdfTemplate} data={buildPdfData(contract)} />).toBlob()
        url = URL.createObjectURL(blob)
      }

      const link = document.createElement('a')
      link.href = url
      link.download = `${contract.contract_number}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      if (url !== previewUrl) URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('Failed to generate PDF')
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <Row>
      <Col xl={9} md={8} sm={12}>
        <Card>
          <CardBody className='d-flex justify-content-between flex-md-row flex-column'>
            <div>
              <h3 className='mb-0'>{contract.contract_number}</h3>
              <p className='text-muted mb-1'>
                {contract.contact_name}
                {contract.company_name ? ` • ${contract.company_name}` : ''}
              </p>
              <p className='mb-0'>
                {contract.email} {contract.phone ? `• ${contract.phone}` : ''}
              </p>
              <p className='mb-0'>
                {frequencyLabel(contract.frequency)}
                {contract.start_date ? ` • Start: ${contract.start_date}` : ''}
                {contract.end_date ? ` • End: ${contract.end_date}` : ''}
              </p>
            </div>
            {currentUserCan('/contract', 'edit') && (
              <div className='mt-md-0 mt-2'>
                <Button tag={Link} to={`/contract/edit/${contract.id}`} color='primary' outline>
                  <Edit2 size={14} className='me-50' /> Edit
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle tag='h4'>Bill To</CardTitle>
          </CardHeader>
          <CardBody>
            <Row>
              <Col md={6} className='mb-1'>
                <p className='text-muted mb-25'>Contact Name</p>
                <p className='mb-0'>{contract.contact_name || '-'}</p>
              </Col>
              <Col md={6} className='mb-1'>
                <p className='text-muted mb-25'>Company Name</p>
                <p className='mb-0'>{contract.company_name || '-'}</p>
              </Col>
              <Col md={6} className='mb-1'>
                <p className='text-muted mb-25'>Email</p>
                <p className='mb-0'>{contract.email || '-'}</p>
              </Col>
              <Col md={6} className='mb-1'>
                <p className='text-muted mb-25'>Phone</p>
                <p className='mb-0'>{contract.phone || '-'}</p>
              </Col>
              <Col md={12}>
                <p className='text-muted mb-25'>Billing Address</p>
                <p className='mb-0'>{contract.billing_address || '-'}</p>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle tag='h4'>Contract Body</CardTitle>
          </CardHeader>
          <CardBody dangerouslySetInnerHTML={{ __html: contract.body || '<p class="text-muted mb-0">No contract text.</p>' }} />
        </Card>

        {contract.terms_content && (
          <Card>
            <CardHeader style={{ cursor: 'pointer' }} onClick={() => setTermsOpen(!termsOpen)}>
              <CardTitle tag='h4' className='d-flex align-items-center'>
                {termsOpen ? <ChevronDown size={18} className='me-50' /> : <ChevronRight size={18} className='me-50' />}
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <Collapse isOpen={termsOpen}>
              <CardBody dangerouslySetInnerHTML={{ __html: contract.terms_content }} />
            </Collapse>
          </Card>
        )}

        {contract.payment_method_content && (
          <Card>
            <CardHeader style={{ cursor: 'pointer' }} onClick={() => setPaymentMethodOpen(!paymentMethodOpen)}>
              <CardTitle tag='h4' className='d-flex align-items-center'>
                {paymentMethodOpen ? <ChevronDown size={18} className='me-50' /> : <ChevronRight size={18} className='me-50' />}
                Payment Method{contract.payment_method_name ? ` — ${contract.payment_method_name}` : ''}
              </CardTitle>
            </CardHeader>
            <Collapse isOpen={paymentMethodOpen}>
              <CardBody dangerouslySetInnerHTML={{ __html: contract.payment_method_content }} />
            </Collapse>
          </Card>
        )}

        {contract.internal_notes && (
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Internal Notes</CardTitle>
            </CardHeader>
            <CardBody>
              <p className='mb-0' style={{ whiteSpace: 'pre-wrap' }}>
                {contract.internal_notes}
              </p>
            </CardBody>
          </Card>
        )}
      </Col>

      <Col xl={3} md={4} sm={12}>
        <div style={{ position: 'sticky', top: '7rem' }}>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Contract Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Label className='form-label' for='contract-status'>
                Status
              </Label>
              <Select
                inputId='contract-status'
                className='react-select mb-2'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={contractStatusOptions}
                value={selectedStatusOption}
                onChange={handleStatusChange}
                isDisabled={!currentUserCan('/contract', 'edit')}
              />
              <Button
                id='contract-download-pdf-btn'
                className='d-none'
                disabled={!pdfTemplate || generatingPdf}
                onClick={handleDownloadPdf}
              >
                Download PDF
              </Button>
              {!pdfTemplate && (
                <p className='text-muted small mb-0 mt-50'>
                  No Contract PDF template selected in <Link to='/company'>Company Settings</Link>.
                </p>
              )}
            </CardBody>
          </Card>

          {pdfTemplate && (
            <Card>
              <CardBody className='p-0'>
                {previewUrl ? (
                  <iframe
                    title='Contract PDF preview'
                    src={previewUrl}
                    style={{ width: '100%', height: '600px', border: 'none' }}
                  />
                ) : (
                  <p className='text-muted mb-0 p-2'>{previewLoading ? 'Generating preview…' : 'Preview unavailable.'}</p>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </Col>
    </Row>
  )
}

export default ContractView
