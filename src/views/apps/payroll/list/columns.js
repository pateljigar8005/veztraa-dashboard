import { Link } from 'react-router-dom'
import { Badge } from 'reactstrap'
import { formatAmount } from '@utils'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const statusColor = {
  draft: 'light-secondary',
  finalized: 'light-success'
}

export const columns = [
  {
    name: 'Month',
    sortable: false,
    minWidth: '180px',
    cell: row => (
      <Link to={`/payroll/view/${row.id}`} className='text-truncate text-body'>
        <span className='fw-bolder'>{monthNames[row.month - 1]} {row.year}</span>
      </Link>
    )
  },
  {
    name: 'Employees',
    width: '130px',
    cell: row => `${row.paid_count} / ${row.employee_count} paid`
  },
  {
    name: 'Total Gross',
    width: '150px',
    cell: row => formatAmount(row.total_gross)
  },
  {
    name: 'Total Net',
    width: '150px',
    cell: row => formatAmount(row.total_net)
  },
  {
    name: 'Status',
    width: '130px',
    cell: row => (
      <Badge className='text-capitalize' color={statusColor[row.status]} pill>
        {row.status}
      </Badge>
    )
  }
]
