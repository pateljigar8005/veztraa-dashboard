import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useDispatch, useSelector } from 'react-redux'
import { CreditCard, Edit2, Trash2, ChevronDown, ChevronRight } from 'react-feather'
import { pdf, ReportDocument } from '@veztraa/report-renderer'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Label, Button, Table, Collapse, Modal, ModalHeader, ModalBody } from 'reactstrap'
import { getInvoice, updateInvoice } from '../store'
import { invoiceStatusOptions } from '../../quotation/documentOptions'
import RecordPaymentModal from '../RecordPaymentModal'
import ComposePopup from '../../email/ComposePopup'
import { selectThemeColors, formatAmount } from '@utils'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { renderEmailTemplate } from '@src/utility/renderEmailTemplate'

const buildPdfData = invoice => ({
  client: {
    name: invoice.contact_name || '',
    company: invoice.company_name || '',
    email: invoice.email || '',
    phone: invoice.phone || '',
    address: invoice.billing_address || ''
  },
  document: {
    number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date
  },
  currency: invoice.currency,
  tax_rate: invoice.tax_rate,
  tax_amount: invoice.tax_amount,
  discount_amount: invoice.discount_amount,
  subtotal: formatAmount(invoice.subtotal),
  total: formatAmount(invoice.total),
  paid_amount: formatAmount(invoice.paid_amount),
  balance_due: formatAmount(invoice.balance_due),
  terms_conditions: invoice.terms_content || '',
  payment_method: invoice.payment_method_content || '',
  service_items: (invoice.line_items || []).map(item => ({
    name: item.description || '',
    qty: item.qty,
    rate: formatAmount(item.rate),
    amount: formatAmount(Number(item.qty) * Number(item.rate))
  }))
})

const InvoiceView = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const store = useSelector(state => state.invoice)

  const [payments, setPayments] = useState([])
  const [paymentsListOpen, setPaymentsListOpen] = useState(false)
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [termsOpen, setTermsOpen] = useState(false)
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false)
  const [pdfTemplate, setPdfTemplate] = useState(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [companySettings, setCompanySettings] = useState(null)
  const [emailTemplate, setEmailTemplate] = useState(null)
  const [preparingEmail, setPreparingEmail] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeInitialValues, setComposeInitialValues] = useState(null)
  const [composeAttachments, setComposeAttachments] = useState([])

  useEffect(() => {
    dispatch(getInvoice(id))
  }, [id])

  useEffect(() => {
    axios.get('/company').then(response => {
      const data = response.data.data
      setCompanySettings(data)
      if (data.invoice_pdf_template_id) {
        axios.get(`/pdf-designer-templates/${data.invoice_pdf_template_id}`).then(templateResponse => {
          setPdfTemplate(templateResponse.data.data.template)
        })
      }
      if (data.invoice_email_template_id) {
        axios.get(`/email-templates/${data.invoice_email_template_id}`).then(templateResponse => {
          setEmailTemplate(templateResponse.data.data)
        })
      }
    })
  }, [])

  const loadPayments = () => {
    axios.get(`/invoices/${id}/payments`).then(response => setPayments(response.data.data.payments))
  }

  useEffect(() => {
    loadPayments()
  }, [id])

  const invoice = store.selectedInvoice

  useEffect(() => {
    if (!invoice || !pdfTemplate) {
      setPreviewUrl(null)
      return
    }

    let cancelled = false
    let objectUrl = null
    setPreviewLoading(true)

    pdf(<ReportDocument template={pdfTemplate} data={buildPdfData(invoice)} />)
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
  }, [invoice, pdfTemplate])

  const handleStatusChange = option => {
    if (!option) return
    dispatch(updateInvoice({ id: Number(id), status: option.value })).then(() => {
      dispatch(getInvoice(id))
      toast.success('Status updated')
    })
  }

  if (!invoice || invoice.id !== Number(id)) {
    return null
  }

  const selectedStatusOption = invoiceStatusOptions.find(i => i.value === invoice.status) || null

  const handleDownloadPdf = async () => {
    if (!pdfTemplate) {
      toast.error('No invoice PDF template is selected in Company Settings.')
      return
    }

    setGeneratingPdf(true)
    try {
      let url = previewUrl
      if (!url) {
        const blob = await pdf(<ReportDocument template={pdfTemplate} data={buildPdfData(invoice)} />).toBlob()
        url = URL.createObjectURL(blob)
      }

      const link = document.createElement('a')
      link.href = url
      link.download = `${invoice.invoice_number}.pdf`
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

  const handleSendEmail = async () => {
    if (!companySettings?.invoice_email_template_id || !companySettings?.invoice_email_mailbox_id) {
      toast.error('Set an Invoice email template and sending mailbox in Company Settings first.')
      return
    }
    if (!emailTemplate) {
      toast.error('The selected email template failed to load.')
      return
    }
    if (!pdfTemplate) {
      toast.error('No invoice PDF template is selected in Company Settings.')
      return
    }
    if (!invoice.email) {
      toast('Client has no email on file - fill in the recipient manually.')
    }

    setPreparingEmail(true)
    try {
      const blob = await pdf(<ReportDocument template={pdfTemplate} data={buildPdfData(invoice)} />).toBlob()
      const file = new File([blob], `${invoice.invoice_number}.pdf`, { type: 'application/pdf' })

      const { subject, body } = renderEmailTemplate(emailTemplate, {
        contact_name: invoice.contact_name || '',
        client_full_name: invoice.client_full_name || invoice.contact_name || '',
        company_name: invoice.company_name || '',
        email: invoice.email || '',
        phone: invoice.phone || '',
        billing_address: invoice.billing_address || '',
        status: invoice.status || '',
        invoice_number: invoice.invoice_number || '',
        issue_date: invoice.issue_date || '',
        due_date: invoice.due_date || '',
        currency: invoice.currency || '',
        total: formatAmount(invoice.total),
        subtotal: formatAmount(invoice.subtotal),
        tax_amount: formatAmount(invoice.tax_amount),
        discount_amount: formatAmount(invoice.discount_amount),
        paid_amount: formatAmount(invoice.paid_amount),
        balance_due: formatAmount(invoice.balance_due),
        sender_company_name: companySettings.legal_name || ''
      })

      setComposeInitialValues({ to: invoice.email || '', cc: '', bcc: '', subject, body })
      setComposeAttachments([file])
      setComposeOpen(true)
    } catch (e) {
      toast.error('Failed to prepare email')
    } finally {
      setPreparingEmail(false)
    }
  }

  return (
    <Row>
      <Col xl={9} md={8} sm={12}>
        <Card>
          <CardBody className='d-flex justify-content-between flex-md-row flex-column'>
            <div>
              <h3 className='mb-0'>{invoice.invoice_number}</h3>
              <p className='text-muted mb-1'>
                {invoice.contact_name}
                {invoice.company_name ? ` • ${invoice.company_name}` : ''}
              </p>
              <p className='mb-0'>
                {invoice.email} {invoice.phone ? `• ${invoice.phone}` : ''}
              </p>
              <p className='mb-0'>
                Issue: {invoice.issue_date} • Due: {invoice.due_date}
              </p>
            </div>
            {currentUserCan('/invoice', 'edit') && (
              <div className='mt-md-0 mt-2'>
                <Button tag={Link} to={`/invoice/edit/${invoice.id}`} color='primary' outline>
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
                <p className='mb-0'>{invoice.contact_name || '-'}</p>
              </Col>
              <Col md={6} className='mb-1'>
                <p className='text-muted mb-25'>Company Name</p>
                <p className='mb-0'>{invoice.company_name || '-'}</p>
              </Col>
              <Col md={6} className='mb-1'>
                <p className='text-muted mb-25'>Email</p>
                <p className='mb-0'>{invoice.email || '-'}</p>
              </Col>
              <Col md={6} className='mb-1'>
                <p className='text-muted mb-25'>Phone</p>
                <p className='mb-0'>{invoice.phone || '-'}</p>
              </Col>
              <Col md={12}>
                <p className='text-muted mb-25'>Billing Address</p>
                <p className='mb-0'>{invoice.billing_address || '-'}</p>
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
              {(invoice.line_items || []).map((item, index) => (
                <tr key={index}>
                  <td>{item.description || '-'}</td>
                  <td>{item.qty}</td>
                  <td>
                    {invoice.currency} {formatAmount(item.rate)}
                  </td>
                  <td className='text-end'>
                    {invoice.currency} {formatAmount(Number(item.qty) * Number(item.rate))}
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
                    {invoice.currency} {formatAmount(invoice.subtotal)}
                  </span>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className='d-flex justify-content-between mb-50'>
                    <span>Tax ({invoice.tax_rate}%)</span>
                    <span>
                      {invoice.currency} {formatAmount(invoice.tax_amount)}
                    </span>
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className='d-flex justify-content-between mb-50'>
                    <span>Discount</span>
                    <span className='text-success'>
                      -{invoice.currency} {formatAmount(invoice.discount_amount)}
                    </span>
                  </div>
                )}
                <hr />
                <div className='d-flex justify-content-between mb-50'>
                  <h5 className='mb-0'>Total</h5>
                  <h5 className='mb-0'>
                    {invoice.currency} {formatAmount(invoice.total)}
                  </h5>
                </div>
                <div className='d-flex justify-content-between mb-50'>
                  <span>Paid</span>
                  <span className='text-success'>
                    {invoice.currency} {formatAmount(invoice.paid_amount)}
                  </span>
                </div>
                <div className='d-flex justify-content-between'>
                  <span className='fw-bolder'>Balance Due</span>
                  <span className='fw-bolder'>
                    {invoice.currency} {formatAmount(invoice.balance_due)}
                  </span>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {invoice.terms_content && (
          <Card>
            <CardHeader style={{ cursor: 'pointer' }} onClick={() => setTermsOpen(!termsOpen)}>
              <CardTitle tag='h4' className='d-flex align-items-center'>
                {termsOpen ? <ChevronDown size={18} className='me-50' /> : <ChevronRight size={18} className='me-50' />}
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <Collapse isOpen={termsOpen}>
              <CardBody dangerouslySetInnerHTML={{ __html: invoice.terms_content }} />
            </Collapse>
          </Card>
        )}

        {invoice.payment_method_content && (
          <Card>
            <CardHeader style={{ cursor: 'pointer' }} onClick={() => setPaymentMethodOpen(!paymentMethodOpen)}>
              <CardTitle tag='h4' className='d-flex align-items-center'>
                {paymentMethodOpen ? <ChevronDown size={18} className='me-50' /> : <ChevronRight size={18} className='me-50' />}
                Payment Method{invoice.payment_method_name ? ` — ${invoice.payment_method_name}` : ''}
              </CardTitle>
            </CardHeader>
            <Collapse isOpen={paymentMethodOpen}>
              <CardBody dangerouslySetInnerHTML={{ __html: invoice.payment_method_content }} />
            </Collapse>
          </Card>
        )}
      </Col>

      <Col xl={3} md={4} sm={12}>
        <div style={{ position: 'sticky', top: '7rem' }}>
          <Card>
            <CardHeader>
              <CardTitle tag='h4'>Invoice Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Label className='form-label' for='invoice-status'>
                Status
              </Label>
              <Select
                inputId='invoice-status'
                className='react-select'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={invoiceStatusOptions}
                value={selectedStatusOption}
                onChange={handleStatusChange}
                isDisabled={!currentUserCan('/invoice', 'edit')}
              />
              <Button color='primary' block onClick={() => setPaymentsListOpen(true)}>
                <CreditCard size={14} className='me-50' />
                Payments
              </Button>
              {currentUserCan('/invoice', 'edit') && (
                // No longer shown here - triggered from the navbar's Send
                // Email icon instead (see NavbarBookmarks.js), same
                // hidden-trigger pattern as invoice-download-pdf-btn below.
                <Button id='invoice-send-email-btn' className='d-none' disabled={preparingEmail} onClick={handleSendEmail}>
                  Send Email
                </Button>
              )}
              <Button
                id='invoice-download-pdf-btn'
                className='d-none'
                disabled={!pdfTemplate || generatingPdf}
                onClick={handleDownloadPdf}
              >
                Download PDF
              </Button>
              {!pdfTemplate && (
                <p className='text-muted small mb-0 mt-50'>
                  No Invoice PDF template selected in <Link to='/company'>Company Settings</Link>.
                </p>
              )}
              {companySettings && (!companySettings.invoice_email_template_id || !companySettings.invoice_email_mailbox_id) && (
                <p className='text-muted small mb-0 mt-50'>
                  Set an email template and sending mailbox for Invoices in{' '}
                  <Link to='/company?tab=email-templates'>Company Settings</Link>.
                </p>
              )}
            </CardBody>
          </Card>

          {pdfTemplate && (
            <Card>
              <CardBody className='p-0'>
                {previewUrl ? (
                  <iframe
                    title='Invoice PDF preview'
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

      <Modal isOpen={paymentsListOpen} toggle={() => setPaymentsListOpen(!paymentsListOpen)} size='lg'>
        <ModalHeader toggle={() => setPaymentsListOpen(!paymentsListOpen)}>Payments</ModalHeader>
        <ModalBody>
          <div className='d-flex justify-content-end mb-1'>
            <Button
              color='primary'
              size='sm'
              onClick={() => {
                setEditingPayment(null)
                setRecordPaymentOpen(true)
              }}
            >
              + Record Payment
            </Button>
          </div>
          {payments.length === 0 ? (
            <p className='text-muted mb-0'>No payments recorded yet.</p>
          ) : (
            <Table responsive className='mb-0'>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Rate</th>
                  <th>Method</th>
                  <th>Notes</th>
                  <th className='text-end'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{p.payment_date}</td>
                    <td>
                      {invoice.currency} {formatAmount(p.amount)}
                    </td>
                    <td>{p.rate_to_inr ? `₹${Number(p.rate_to_inr).toFixed(2)}` : '-'}</td>
                    <td>{p.payment_method_name || '-'}</td>
                    <td>{p.notes || '-'}</td>
                    <td className='text-end'>
                      <Button
                        className='btn-icon me-50'
                        color='flat-primary'
                        size='sm'
                        onClick={() => {
                          setEditingPayment(p)
                          setRecordPaymentOpen(true)
                        }}
                      >
                        <Edit2 size={14} className='text-primary' />
                      </Button>
                      <Button
                        className='btn-icon'
                        color='flat-danger'
                        size='sm'
                        onClick={() =>
                          confirmDelete({
                            text: `This will permanently delete this payment of ${invoice.currency} ${formatAmount(p.amount)}.`,
                            onConfirm: () =>
                              axios.delete(`/invoice-payments/${p.id}`).then(() => {
                                toast.success('Payment deleted')
                                loadPayments()
                                dispatch(getInvoice(id))
                              })
                          })
                        }
                      >
                        <Trash2 size={14} className='text-danger' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </ModalBody>
      </Modal>

      <RecordPaymentModal
        isOpen={recordPaymentOpen}
        toggle={() => setRecordPaymentOpen(!recordPaymentOpen)}
        invoiceId={id}
        currency={invoice.currency}
        balanceDue={editingPayment ? invoice.balance_due + Number(editingPayment.amount) : invoice.balance_due}
        payment={editingPayment}
        onSaved={() => {
          loadPayments()
          dispatch(getInvoice(id))
        }}
      />

      <ComposePopup
        composeOpen={composeOpen}
        toggleCompose={() => setComposeOpen(prev => !prev)}
        replyTo={null}
        initialValues={composeInitialValues}
        initialAttachments={composeAttachments}
        adminMailboxId={companySettings?.invoice_email_mailbox_id}
        adminMailboxEmail={companySettings?.invoice_email_mailbox_email}
        container='body'
        hideTemplateAndDraft
      />
    </Row>
  )
}

export default InvoiceView