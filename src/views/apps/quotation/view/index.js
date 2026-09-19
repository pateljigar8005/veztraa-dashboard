import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useDispatch, useSelector } from 'react-redux'
import { Edit2, ChevronDown, ChevronRight } from 'react-feather'
import { pdf, ReportDocument } from '@veztraa/report-renderer'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Label, Button, Table, Collapse } from 'reactstrap'
import { getQuotation, updateQuotation } from '../store'
import { quotationStatusOptions } from '../documentOptions'
import { selectThemeColors, formatAmount } from '@utils'
import { currentUserCan } from '@src/utility/navPermissions'

const buildPdfData = quotation => ({
  client: {
    name: quotation.contact_name || '',
    company: quotation.company_name || '',
    email: quotation.email || '',
    phone: quotation.phone || '',
    address: quotation.billing_address || ''
  },
  document: {
    number: quotation.quotation_number,
    issue_date: quotation.issue_date,
    valid_until: quotation.valid_until
  },
  currency: quotation.currency,
  tax_rate: quotation.tax_rate,
  tax_amount: quotation.tax_amount,
  discount_amount: quotation.discount_amount,
  subtotal: formatAmount(quotation.subtotal),
  total: formatAmount(quotation.total),
  terms_conditions: quotation.terms_content || '',
  payment_method: quotation.payment_method_content || '',
  notes: quotation.notes || '',
  service_items: (quotation.line_items || []).map(item => ({
    name: item.description || '',
    qty: item.qty,
    rate: formatAmount(item.rate),
    amount: formatAmount(Number(item.qty) * Number(item.rate))
  }))
})

const QuotationView = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const store = useSelector(state => state.quotations)

  const [termsOpen, setTermsOpen] = useState(false)
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false)
  const [pdfTemplate, setPdfTemplate] = useState(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    dispatch(getQuotation(id))
  }, [id])

  useEffect(() => {
    axios.get('/company').then(response => {
      const templateId = response.data.data.quotation_pdf_template_id
      if (!templateId) return
      axios.get(`/pdf-designer-templates/${templateId}`).then(templateResponse => {
        setPdfTemplate(templateResponse.data.data.template)
      })
    })
  }, [])

  const quotation = store.selectedQuotation

  useEffect(() => {
    if (!quotation || !pdfTemplate) {
      setPreviewUrl(null)
      return
    }

    let cancelled = false
    let objectUrl = null
    setPreviewLoading(true)

    pdf(<ReportDocument template={pdfTemplate} data={buildPdfData(quotation)} />)
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
  }, [quotation, pdfTemplate])

  const handleStatusChange = option => {
    if (!option) return
    dispatch(updateQuotation({ id: Number(id), status: option.value })).then(() => {
      dispatch(getQuotation(id))
      toast.success('Status updated')
    })
  }

  if (!quotation || quotation.id !== Number(id)) {
    return null
  }

  const selectedStatusOption = quotationStatusOptions.find(i => i.value === quotation.status) || null

  const handleDownloadPdf = async () => {
    if (!pdfTemplate) {
      toast.error('No quotation PDF template is selected in Company Settings.')
      return
    }

    setGeneratingPdf(true)
    try {
      let url = previewUrl
      if (!url) {
        const blob = await pdf(<ReportDocument template={pdfTemplate} data={buildPdfData(quotation)} />).toBlob()
        url = URL.createObjectURL(blob)
      }

      const link = document.createElement('a')
      link.href = url
      link.download = `${quotation.quotation_number}.pdf`
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
              <h3 className='mb-0'>{quotation.quotation_number}</h3>
              <p className='text-muted mb-1'>
                {quotation.contact_name}
                {quotation.company_name ? ` • ${quotation.company_name}` : ''}
              </p>
              <p className='mb-0'>
                {quotation.email} {quotation.phone ? `• ${quotation.phone}` : ''}
              </p>
              <p className='mb-0'>
                Issue: {quotation.issue_date} • Valid Until: {quotation.valid_until}
              </p>
            </div>
            {currentUserCan('/quotation', 'edit') && (
              <div className='mt-md-0 mt-2'>
                <Button tag={Link} to={`/quotation/edit/${quotation.id}`} color='primary' outline>
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
                <p className='mb-0'>{quotation.contact_name || '-'}</p>
              </Col>
              <Col md={6} className='mb-1'>
                <p className='text-muted mb-25'>Company Name</p>
                <p className='mb-0'>{quotation.company_name || '-'}</p>
              </Col>
              <Col md={6} className='mb-1'>
                <p className='text-muted mb-25'>Email</p>
                <p className='mb-0'>{quotation.email || '-'}</p>
              </Col>
              <Col md={6} className='mb-1'>
                <p className='text-muted mb-25'>Phone</p>
                <p className='mb-0'>{quotation.phone || '-'}</p>
              </Col>
              <Col md={12}>
                <p className='text-muted mb-25'>Billing Address</p>
                <p className='mb-0'>{quotation.billing_address || '-'}</p>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle tag='h4'>Service Items</CardTitle>
          </CardHeader>
          <Table responsive className='mb-0'>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th className='text-end'>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(quotation.line_items || []).map((item, index) => (
                <tr key={index}>
                  <td>{item.description || '-'}</td>
                  <td>{item.qty}</td>
                  <td>
                    {quotation.currency} {formatAmount(item.rate)}
                  </td>
                  <td className='text-end'>
                    {quotation.currency} {formatAmount(Number(item.qty) * Number(item.rate))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <CardBody>
            <Row>
              <Col md={{ size: 5, offset: 7 }}>
                <div className='d-flex justify-content-between mb-50'>
                  <span>Subtotal</span>
                  <span>
                    {quotation.currency} {formatAmount(quotation.subtotal)}
                  </span>
                </div>
                {quotation.tax_amount > 0 && (
                  <div className='d-flex justify-content-between mb-50'>
                    <span>Tax ({quotation.tax_rate}%)</span>
                    <span>
                      {quotation.currency} {formatAmount(quotation.tax_amount)}
                    </span>
                  </div>
                )}
                {quotation.discount_amount > 0 && (
                  <div className='d-flex justify-content-between mb-50'>
                    <span>Discount</span>
                    <span className='text-success'>
                      -{quotation.currency} {formatAmount(quotation.discount_amount)}
                    </span>
                  </div>
                )}
                <hr />
                <div className='d-flex justify-content-between'>
                  <h5 className='mb-0'>Total</h5>
                  <h5 className='mb-0'>
                    {quotation.currency} {formatAmount(quotation.total)}
                  </h5>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {quotation.notes && (
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Notes</CardTitle>
            </CardHeader>
            <CardBody>
              <p className='mb-0' style={{ whiteSpace: 'pre-wrap' }}>
                {quotation.notes}
              </p>
            </CardBody>
          </Card>
        )}

        {quotation.terms_content && (
          <Card>
            <CardHeader style={{ cursor: 'pointer' }} onClick={() => setTermsOpen(!termsOpen)}>
              <CardTitle tag='h4' className='d-flex align-items-center'>
                {termsOpen ? <ChevronDown size={18} className='me-50' /> : <ChevronRight size={18} className='me-50' />}
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <Collapse isOpen={termsOpen}>
              <CardBody dangerouslySetInnerHTML={{ __html: quotation.terms_content }} />
            </Collapse>
          </Card>
        )}

        {quotation.payment_method_content && (
          <Card>
            <CardHeader style={{ cursor: 'pointer' }} onClick={() => setPaymentMethodOpen(!paymentMethodOpen)}>
              <CardTitle tag='h4' className='d-flex align-items-center'>
                {paymentMethodOpen ? <ChevronDown size={18} className='me-50' /> : <ChevronRight size={18} className='me-50' />}
                Payment Method{quotation.payment_method_name ? ` — ${quotation.payment_method_name}` : ''}
              </CardTitle>
            </CardHeader>
            <Collapse isOpen={paymentMethodOpen}>
              <CardBody dangerouslySetInnerHTML={{ __html: quotation.payment_method_content }} />
            </Collapse>
          </Card>
        )}
      </Col>

      <Col xl={3} md={4} sm={12}>
        <div style={{ position: 'sticky', top: '7rem' }}>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Quotation Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Label className='form-label' for='quotation-status'>
                Status
              </Label>
              <Select
                inputId='quotation-status'
                className='react-select mb-2'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={quotationStatusOptions}
                value={selectedStatusOption}
                onChange={handleStatusChange}
                isDisabled={!currentUserCan('/quotation', 'edit')}
              />
              <Button
                id='quotation-download-pdf-btn'
                className='d-none'
                disabled={!pdfTemplate || generatingPdf}
                onClick={handleDownloadPdf}
              >
                Download PDF
              </Button>
              {!pdfTemplate && (
                <p className='text-muted small mb-0 mt-50'>
                  No Quotation PDF template selected in <Link to='/company'>Company Settings</Link>.
                </p>
              )}
            </CardBody>
          </Card>

          {pdfTemplate && (
            <Card>
              <CardBody className='p-0'>
                {previewUrl ? (
                  <iframe
                    title='Quotation PDF preview'
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

export default QuotationView