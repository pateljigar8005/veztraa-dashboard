import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { Edit2, FileText, PenTool, DollarSign } from 'react-feather'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Badge, Button, Table } from 'reactstrap'
import { getClient } from '../store'
import { formatAmount } from '@utils'
import HistoryModal from '../../activity-log/HistoryModal'

const statusColorObj = {
  draft: 'light-secondary',
  sent: 'light-info',
  accepted: 'light-success',
  paid: 'light-success',
  rejected: 'light-danger',
  overdue: 'light-danger',
  expired: 'light-warning',
  partial: 'light-warning',
  active: 'light-info',
  signed: 'light-success',
  terminated: 'light-danger'
}

const computeTotal = doc => {
  const subtotal = (doc.line_items || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0)
  const taxAmount = subtotal * ((Number(doc.tax_rate) || 0) / 100)
  const discountAmount = doc.discount_type === '%' ? subtotal * ((Number(doc.discount_value) || 0) / 100) : Number(doc.discount_value) || 0
  return subtotal + taxAmount - discountAmount
}

const ClientView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.clients)

  const [quotations, setQuotations] = useState([])
  const [contracts, setContracts] = useState([])
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    dispatch(getClient(id))
    axios.get('/quotations', { params: { perPage: 100 } }).then(response => {
      setQuotations(response.data.data.quotations.filter(q => q.client_id === Number(id)))
    })
    axios.get('/contracts', { params: { perPage: 100 } }).then(response => {
      setContracts(response.data.data.contracts.filter(c => c.client_id === Number(id)))
    })
    axios.get('/invoices', { params: { perPage: 100 } }).then(response => {
      setInvoices(response.data.data.invoices.filter(i => i.client_id === Number(id)))
    })
  }, [id])

  const client = store.selectedClient

  if (!client || client.id !== Number(id)) {
    return null
  }

  return (
    <div>
      <Card>
        <CardBody className='d-flex justify-content-between flex-md-row flex-column'>
          <div>
            <h3 className='mb-0'>{client.fullName}</h3>
            <p className='text-muted mb-1'>{client.company_name || 'No company'}</p>
            <p className='mb-0'>
              {client.email} {client.phone ? `• ${client.phone}` : ''}
            </p>
            <p className='mb-0'>Industry: {client.industry_name || '-'}</p>
          </div>
          <div className='d-flex flex-column align-items-md-end mt-md-0 mt-2'>
            <Badge className='text-capitalize mb-2' color={client.is_active ? 'light-success' : 'light-secondary'} pill>
              {client.status}
            </Badge>
            <Button tag={Link} to={`/client/edit/${client.id}`} color='primary' outline>
              <Edit2 size={14} className='me-50' /> Edit Client
            </Button>
            <HistoryModal entityType='client' entityId={client.id} entityLabel={client.fullName} buttonId='client-view-history-btn' />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>
            <PenTool size={18} className='me-1' /> Quotations
          </CardTitle>
          <Button color='primary' size='sm' onClick={() => navigate(`/quotation/add?client_id=${id}`)}>
            + New Quotation
          </Button>
        </CardHeader>
        <CardBody>
          {quotations.length === 0 ? (
            <p className='text-muted mb-0'>No quotations yet.</p>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Issue Date</th>
                  <th>Valid Until</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => (
                  <tr key={q.id}>
                    <td>{q.issue_date}</td>
                    <td>{q.valid_until}</td>
                    <td>
                      {q.currency} {formatAmount(computeTotal(q))}
                    </td>
                    <td>
                      <Badge className='text-capitalize' color={statusColorObj[q.status] || 'light-secondary'} pill>
                        {q.status}
                      </Badge>
                    </td>
                    <td>
                      <Button tag={Link} to={`/quotation/edit/${q.id}`} size='sm' color='flat-primary'>
                        <Edit2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>
            <FileText size={18} className='me-1' /> Contracts
          </CardTitle>
          <Button color='primary' size='sm' onClick={() => navigate(`/contract/add?client_id=${id}`)}>
            + New Contract
          </Button>
        </CardHeader>
        <CardBody>
          {contracts.length === 0 ? (
            <p className='text-muted mb-0'>No contracts yet.</p>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Frequency</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => (
                  <tr key={c.id}>
                    <td className='text-capitalize'>{(c.frequency || '-').replace('_', ' ')}</td>
                    <td>{c.start_date || '-'}</td>
                    <td>
                      <Badge className='text-capitalize' color={statusColorObj[c.status] || 'light-secondary'} pill>
                        {c.status}
                      </Badge>
                    </td>
                    <td>
                      <Button tag={Link} to={`/contract/edit/${c.id}`} size='sm' color='flat-primary'>
                        <Edit2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>
            <DollarSign size={18} className='me-1' /> Invoices
          </CardTitle>
          <Button color='primary' size='sm' onClick={() => navigate(`/invoice/add?client_id=${id}`)}>
            + New Invoice
          </Button>
        </CardHeader>
        <CardBody>
          {invoices.length === 0 ? (
            <p className='text-muted mb-0'>No invoices yet.</p>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(i => (
                  <tr key={i.id}>
                    <td>{i.issue_date}</td>
                    <td>{i.due_date}</td>
                    <td>
                      {i.currency} {formatAmount(computeTotal(i))}
                    </td>
                    <td>
                      <Badge className='text-capitalize' color={statusColorObj[i.status] || 'light-secondary'} pill>
                        {i.status}
                      </Badge>
                    </td>
                    <td>
                      <Button tag={Link} to={`/invoice/edit/${i.id}`} size='sm' color='flat-primary'>
                        <Edit2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default ClientView