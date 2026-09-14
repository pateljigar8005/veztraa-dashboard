// ** React Imports
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Store & Actions
import { store } from '@store/store'
import { deleteInvoice } from '../store'

// ** Icons Imports
import { Copy, FileText, Trash2 } from 'react-feather'

// ** Reactstrap Imports
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'

// ** Utils
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

const statusColorObj = {
  draft: 'light-secondary',
  sent: 'light-info',
  paid: 'light-success',
  partial: 'light-warning',
  overdue: 'light-danger'
}

const computeTotal = i => {
  const subtotal = (i.line_items || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0)
  const taxAmount = subtotal * ((Number(i.tax_rate) || 0) / 100)
  const discountAmount = i.discount_type === '%' ? subtotal * ((Number(i.discount_value) || 0) / 100) : Number(i.discount_value) || 0
  return subtotal + taxAmount - discountAmount
}

export const columns = [
  {
    name: 'Invoice #',
    sortable: true,
    minWidth: '140px',
    sortField: 'id',
    selector: row => row.invoice_number,
    cell: row => (
      <Link to={`/invoice/view/${row.id}`} className='text-body'>
        <span className='fw-bolder'>{row.invoice_number}</span>
      </Link>
    )
  },
  {
    name: 'Customer',
    sortable: true,
    minWidth: '240px',
    sortField: 'contact_name',
    selector: row => row.contact_name,
    cell: row => (
      <div className='d-flex flex-column'>
        <Link to={`/invoice/view/${row.id}`} className='user_name text-truncate text-body'>
          <span className='fw-bolder'>{row.contact_name}</span>
        </Link>
        <small className='text-truncate text-muted mb-0'>{row.company_name || '-'}</small>
      </div>
    )
  },
  {
    name: 'Due Date',
    minWidth: '140px',
    sortable: true,
    sortField: 'due_date',
    selector: row => row.due_date,
    cell: row => <span>{row.due_date}</span>
  },
  {
    name: 'Total',
    minWidth: '120px',
    selector: row => row.total,
    cell: row => (
      <span>
        {row.currency} {computeTotal(row).toFixed(2)}
      </span>
    )
  },
  {
    name: 'Balance Due',
    minWidth: '130px',
    selector: row => row.balance_due,
    cell: row => (
      <span className={Number(row.balance_due) > 0 ? 'text-danger' : 'text-success'}>
        {row.currency} {Number(row.balance_due ?? computeTotal(row)).toFixed(2)}
      </span>
    )
  },
  {
    name: 'Status',
    minWidth: '120px',
    sortable: true,
    sortField: 'status',
    selector: row => row.status,
    cell: row => (
      <Badge className='text-capitalize' color={statusColorObj[row.status] || 'light-secondary'} pill>
        {row.status}
      </Badge>
    )
  },
  {
    name: 'Actions',
    right: true,
    minWidth: '130px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        <Button
          tag={Link}
          to={`/invoice/view/${row.id}`}
          id={`details-tooltip-${row.id}`}
          className='btn-icon me-1'
          color='flat-secondary'
          size='sm'
          style={{ borderRadius: '4px', backgroundColor: '#82868b1f' }}
        >
          <FileText size={16} className='text-secondary' />
        </Button>
        <UncontrolledTooltip placement='top' target={`details-tooltip-${row.id}`}>
          Details
        </UncontrolledTooltip>

        {currentUserCan('/invoice', 'add') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/invoice/add?clone=${row.id}`}
              id={`clone-tooltip-${row.id}`}
              className='btn-icon me-1'
              color='flat-secondary'
              size='sm'
              style={{ borderRadius: '4px', backgroundColor: '#82868b1f' }}
            >
              <Copy size={16} className='text-secondary' />
            </Button>
            <UncontrolledTooltip placement='top' target={`clone-tooltip-${row.id}`}>
              Clone
            </UncontrolledTooltip>
          </Fragment>
        )}

        {currentUserCan('/invoice', 'delete') && (
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
                  text: `This will permanently delete the invoice for "${row.contact_name}".`,
                  onConfirm: () => store.dispatch(deleteInvoice(row.id)).then(() => toast.success('Invoice deleted'))
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
