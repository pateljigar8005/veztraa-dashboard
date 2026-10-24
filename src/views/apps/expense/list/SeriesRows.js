import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Edit2, Repeat, Calendar } from 'react-feather'
import { Badge, Button, Table, UncontrolledTooltip } from 'reactstrap'
import Skeleton from '@components/skeleton'
import TableRowsSkeleton from '@components/skeleton/TableRowsSkeleton'
import { formatAmount, formatDate } from '@utils'

const shortDate = value => (value ? formatDate(`${value}T00:00:00`, { day: 'numeric', month: 'short', year: 'numeric' }) : '')

// Per-currency totals - a series can change currency over time (e.g. a
// subscription billed in $ that later moved to ₹), and adding $ and ₹
// amounts together into one number would be meaningless.
export const totalsByCurrency = rows =>
  rows.reduce((acc, row) => {
    acc[row.currency] = (acc[row.currency] || 0) + Number(row.amount || 0)
    return acc
  }, {})

export const formatTotals = totals =>
  Object.entries(totals)
    .map(([currency, amount]) => `${currency} ${formatAmount(amount)}`)
    .join(' + ')

// Expanded content for a recurring series row: every payment in the series
// (the original plus each auto-created copy), newest first, each opening its
// own expense to edit that one month.
const SeriesRows = ({ data: series }) => {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    axios
      .get(`/expenses/${series.id}/occurrences`)
      .then(response => setRows(response.data.data.expenses))
      .catch(() => setError(true))
  }, [series.id])

  if (error) return <p className='text-danger small px-2 py-1 mb-0'>Couldn't load the payments for this series.</p>
  // Same shape as the loaded view (summary chips, then a table of payments)
  // so the row doesn't jump when the data arrives.
  if (!rows) {
    return (
      <div className='px-2 py-1' style={{ background: 'rgba(var(--bs-primary-rgb), 0.03)' }}>
        <div className='d-flex mb-1' style={{ gap: '0.5rem' }}>
          <Skeleton width={110} height={20} />
          <Skeleton width={190} height={20} />
          <Skeleton width={170} height={20} />
        </div>
        <div className='border rounded overflow-hidden'>
          <TableRowsSkeleton rows={Math.min((series.copy_count || 0) + 1, 6)} columns={[6, 30, 25, 25, 6]} />
        </div>
      </div>
    )
  }

  return (
    <div className='px-2 py-1' style={{ background: 'rgba(var(--bs-primary-rgb), 0.03)' }}>
      <div className='d-flex flex-wrap align-items-center mb-1' style={{ gap: '0.5rem' }}>
        <Badge color='light-primary' className='d-inline-flex align-items-center'>
          <Repeat size={12} className='me-50' />
          {rows.length} payment{rows.length === 1 ? '' : 's'}
        </Badge>
        <Badge color='light-success'>Total paid: {formatTotals(totalsByCurrency(rows))}</Badge>
        {series.next_occurrence_date ? (
          <Badge color='light-info' className='d-inline-flex align-items-center'>
            <Calendar size={12} className='me-50' />
            Next payment: {shortDate(series.next_occurrence_date)}
          </Badge>
        ) : (
          <Badge color='light-secondary'>Finished</Badge>
        )}
      </div>

      <div className='border rounded overflow-hidden'>
        <Table size='sm' striped hover responsive className='mb-0'>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>Payment date</th>
              <th>Entry</th>
              <th className='text-end'>Amount</th>
              <th className='text-end' style={{ width: '70px' }}>
                Edit
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td className='text-muted'>{rows.length - index}</td>
                <td>{shortDate(row.expense_date)}</td>
                <td>
                  {row.recurring_parent_id ? (
                    <span className='text-muted'>Auto-created</span>
                  ) : (
                    <Badge color='light-primary' pill>
                      Original
                    </Badge>
                  )}
                </td>
                <td className='text-end fw-bolder'>
                  {row.currency} {formatAmount(row.amount)}
                </td>
                <td className='text-end'>
                  <Button
                    tag={Link}
                    to={`/expense/edit/${row.id}`}
                    id={`series-edit-${row.id}`}
                    color='flat-secondary'
                    size='sm'
                    className='btn-icon'
                  >
                    <Edit2 size={14} />
                  </Button>
                  <UncontrolledTooltip placement='top' target={`series-edit-${row.id}`}>
                    Edit this payment
                  </UncontrolledTooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )
}

export default SeriesRows
