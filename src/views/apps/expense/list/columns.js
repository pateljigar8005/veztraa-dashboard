import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteExpense } from '../store'
import { Edit2, Trash2 } from 'react-feather'
import { Button, UncontrolledTooltip } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { formatAmount } from '@utils'
import { getCachedThemeColor } from '@src/utility/themeColor'

export const columns = [
  {
    name: 'Category',
    sortable: true,
    minWidth: '200px',
    sortField: 'category',
    selector: row => row.category,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
        <Link to={`/expense/edit/${row.id}`} className='user_name text-truncate text-body' title={row.category}>
          <span className='fw-bolder'>{row.category}</span>
        </Link>
        {row.vendor_name && (
          <small className='text-truncate text-muted mb-0' title={row.vendor_name}>
            {row.vendor_name}
          </small>
        )}
      </div>
    )
  },
  {
    name: 'Client / Project',
    minWidth: '180px',
    selector: row => row.client_full_name || row.project_name,
    cell: row => (
      <div className='d-flex flex-column'>
        <span>{row.client_full_name || '-'}</span>
        {row.project_name && <small className='text-muted'>{row.project_name}</small>}
      </div>
    )
  },
  {
    name: 'Date',
    width: '130px',
    sortable: true,
    sortField: 'expense_date',
    selector: row => row.expense_date,
    cell: row => <span>{row.expense_date}</span>
  },
  {
    name: 'Amount',
    width: '150px',
    right: true,
    sortable: true,
    sortField: 'amount',
    selector: row => Number(row.amount),
    cell: row => (
      <span className='fw-bolder'>
        {row.currency} {formatAmount(row.amount)}
      </span>
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
