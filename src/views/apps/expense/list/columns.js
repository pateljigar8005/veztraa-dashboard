import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteExpense } from '../store'
import { Edit2, Trash2, Repeat } from 'react-feather'
import { Button, UncontrolledTooltip } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { formatAmount, formatDate } from '@utils'
import { getCachedThemeColor } from '@src/utility/themeColor'

const TYPE_LABELS = { one_time: 'One-time', subscription: 'Subscription', emi: 'EMI' }
const REPEAT_LABELS = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
// Date-only strings parsed as local midnight - new Date('YYYY-MM-DD') is UTC
// and can show the previous day in timezones behind UTC.
const shortDate = value => (value ? formatDate(`${value}T00:00:00`, { day: 'numeric', month: 'short', year: 'numeric' }) : '')

export const columns = [
  {
    name: 'Expense',
    sortable: true,
    minWidth: '220px',
    sortField: 'category',
    selector: row => row.category,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
        <Link to={`/expense/edit/${row.id}`} className='text-truncate text-body fw-bolder' title={row.category}>
          {row.category}
        </Link>
        <small className='text-truncate text-muted' title={row.vendor_name || ''}>
          {row.vendor_name || 'No vendor'}
        </small>
      </div>
    )
  },
  {
    name: 'Type',
    minWidth: '190px',
    selector: row => row.expense_type,
    cell: row => {
      const repeat = REPEAT_LABELS[row.recurrence] || (row.copy_count > 0 ? 'Stopped' : null)
      const type = TYPE_LABELS[row.expense_type] || 'One-time'
      if (repeat) {
        const paid = 1 + (row.copy_count || 0)
        return (
          <div className='d-flex flex-column'>
            <span className='d-flex align-items-center'>
              {type}
              <span className='text-muted ms-50 d-inline-flex align-items-center'>
                <Repeat size={11} className='me-25' />
                {repeat}
              </span>
            </span>
            <small className='text-muted'>
              {paid}
              {row.recurrence_count ? ` of ${row.recurrence_count}` : ''} paid
              {row.next_occurrence_date ? ` · next ${shortDate(row.next_occurrence_date)}` : ' · finished'}
            </small>
          </div>
        )
      }
      return (
        <div className='d-flex flex-column'>
          <span>{type}</span>
          {row.recurring_parent_id && <small className='text-muted'>Recurring payment</small>}
        </div>
      )
    }
  },
  {
    name: 'Client / Project',
    minWidth: '180px',
    selector: row => row.client_full_name || row.project_name,
    cell: row =>
      row.client_full_name || row.project_name ? (
        <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
          <span className='text-truncate'>{row.client_full_name || row.project_name}</span>
          {row.client_full_name && row.project_name && (
            <small className='text-truncate text-muted'>{row.project_name}</small>
          )}
        </div>
      ) : (
        <span className='text-muted'>General</span>
      )
  },
  {
    name: 'Date',
    width: '130px',
    sortable: true,
    sortField: 'expense_date',
    selector: row => row.expense_date,
    cell: row => <span>{shortDate(row.expense_date)}</span>
  },
  {
    name: 'Amount',
    width: '150px',
    right: true,
    sortable: true,
    sortField: 'amount',
    selector: row => Number(row.amount),
    cell: row => (
      <span>
        {row.currency} {formatAmount(row.amount)}
      </span>
    )
  },
  {
    // Everything paid so far - for a recurring series that's the original
    // plus every auto-created payment (in the series' own currency; payments
    // in another currency are flagged and shown when the row is expanded).
    name: 'Total Paid',
    width: '160px',
    right: true,
    selector: row => Number(row.amount) + Number(row.copy_total || 0),
    cell: row => (
      <div className='d-flex flex-column align-items-end'>
        <span className='fw-bolder'>
          {row.currency} {formatAmount(Number(row.amount) + Number(row.copy_total || 0))}
        </span>
        {row.copy_other_currency > 0 && (
          <small className='text-muted' title='Some payments in this series were in another currency - expand the row to see every total'>
            + other currency
          </small>
        )}
      </div>
    )
  },
  {
    name: 'Actions',
    right: true,
    width: '120px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/expense', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/expense/edit/${row.id}`}
              id={`edit-tooltip-${row.id}`}
              className='btn-icon me-1'
              color='flat-primary'
              size='sm'
              style={{ borderRadius: '4px', backgroundColor: getCachedThemeColor() + '1f' }}
            >
              <Edit2 size={16} className='text-primary' />
            </Button>
            <UncontrolledTooltip placement='top' target={`edit-tooltip-${row.id}`}>
              Edit
            </UncontrolledTooltip>
          </Fragment>
        )}

        {currentUserCan('/expense', 'delete') && (
          <Fragment>
            <Button
              tag='a'
              href='/'
              id={`delete-tooltip-${row.id}`}
              className='btn-icon'
              color='flat-danger'
              size='sm'
              style={{ borderRadius: '4px', backgroundColor: '#ea54551f' }}
              onClick={e => {
                e.preventDefault()
                confirmDelete({
                  text: `This will permanently delete this "${row.category}" expense.`,
                  onConfirm: () =>
                    store.dispatch(deleteExpense(row.id)).unwrap().then(() => toast.success('Expense deleted')).catch(err => toast.error(err?.message || 'Failed to delete'))
                })
              }}
            >
              <Trash2 size={16} className='text-danger' />
            </Button>
            <UncontrolledTooltip placement='top' target={`delete-tooltip-${row.id}`}>
              Delete
            </UncontrolledTooltip>
          </Fragment>
        )}
      </div>
    )
  }
]
