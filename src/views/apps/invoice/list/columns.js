import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteInvoice } from '../store'
import { Copy, FileText, Trash2 } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { formatAmount } from '@utils'
import SourceReference from '../SourceReference'

export const statusColorObj = {
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
    width: '150px',
    sortField: 'id',
    selector: row => row.invoice_number,
    cell: row => (
      <Link to={`/invoice/view/${row.id}`} className='text-body'>
        <span className='fw-bolder'>{row.invoice_number}</span>
      </Link>
    )
  },
  {
    name: 'Reference',
    width: '180px',
    selector: row => row.quotation_number || row.contract_number || '',
    cell: row => <SourceReference invoice={row} empty={<span className='text-muted'>-</span>} />
  },
  {
    name: 'Customer',
    sortable: true,
    minWidth: '240px',
    sortField: 'contact_name',
    selector: row => row.contact_name,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
        <Link to={`/invoice/view/${row.id}`} className='user_name text-truncate text-body' title={row.contact_name}>
          <span className='fw-bolder'>{row.contact_name}</span>
        </Link>
        <small className='text-truncate text-muted mb-0' title={row.company_name || '-'}>
          {row.company_name || '-'}
        </small>
      </div>
    )
  },
  {
    name: 'Due Date',
    width: '150px',
    sortable: true,
    sortField: 'due_date',
    selector: row => row.due_date,
    cell: row => <span>{row.due_date}</span>
  },
  {
    name: 'Total',
    width: '140px',
    selector: row => row.total,
    cell: row => (
      <span>
        {row.currency} {formatAmount(computeTotal(row))}
      </span>
    )
  },
  {
    name: 'Balance Due',
    width: '150px',
    selector: row => row.balance_due,
    cell: row => (
      <span className={Number(row.balance_due) > 0 ? 'text-danger' : 'text-success'}>
        {row.currency} {formatAmount(row.balance_due ?? computeTotal(row))}
      </span>
    )
  },
  {
    name: 'Status',
    width: '130px',
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
    width: '150px',
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
                  onConfirm: () => store.dispatch(deleteInvoice(row.id)).unwrap().then(() => toast.success('Invoice deleted')).catch(err => toast.error(err?.message || 'Failed to delete'))
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