import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Badge, Card, CardHeader, CardTitle, CardBody, Spinner } from 'reactstrap'
import { formatAmount } from '@utils'
import { currentUserCan } from '@src/utility/navPermissions'
import { statusColorObj } from './list/columns'

// Invoices raised from a quotation or under a contract, on that record's
// own view page - backed by GET /invoices?quotation_id=/contract_id=
// (Invoice::FILTERABLE). Hidden entirely for anyone without Invoice view
// permission, since each row links into the Invoice module.
const LinkedInvoicesCard = ({ filterKey, id, emptyText }) => {
  const canView = currentUserCan('/invoice', 'view')
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    if (!canView || !id) return
    setLoading(true)
    axios
      .get('/invoices', { params: { [filterKey]: id, perPage: 100, sortColumn: 'id', sortDirection: 'desc' } })
      .then(response => setInvoices(response.data.data.invoices))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false))
  }, [filterKey, id, canView])

  if (!canView) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>Invoices</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className='text-center'>
            <Spinner size='sm' color='primary' />
          </div>
        ) : invoices.length === 0 ? (
          <p className='text-muted mb-0'>{emptyText}</p>
        ) : (
          invoices.map(invoice => (
            <div key={invoice.id} className='d-flex justify-content-between align-items-center mb-75'>
              <div>
                <Link to={`/invoice/view/${invoice.id}`} className='fw-bolder'>
                  {invoice.invoice_number}
                </Link>
                <div>
                  <small className='text-muted'>
                    {invoice.currency} {formatAmount(invoice.total)} • {invoice.issue_date}
                  </small>
                </div>
              </div>
              <Badge className='text-capitalize' color={statusColorObj[invoice.status] || 'light-secondary'} pill>
                {invoice.status}
              </Badge>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  )
}

export default LinkedInvoicesCard
