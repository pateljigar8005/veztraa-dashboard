// ** React Imports
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Store & Actions
import { store } from '@store/store'
import { deleteQuotation } from '../store'

// ** Icons Imports
import { Copy, Edit2, Trash2 } from 'react-feather'

// ** Reactstrap Imports
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'

// ** Utils
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

const statusColorObj = {
  draft: 'light-secondary',
  sent: 'light-info',
  accepted: 'light-success',
  rejected: 'light-danger',
  expired: 'light-warning'
}

const computeTotal = q => {
  const subtotal = (q.line_items || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0)
  const taxAmount = subtotal * ((Number(q.tax_rate) || 0) / 100)
  const discountAmount = q.discount_type === '%' ? subtotal * ((Number(q.discount_value) || 0) / 100) : Number(q.discount_value) || 0
  return subtotal + taxAmount - discountAmount
}

export const columns = [
  {
    name: 'Quotation #',
    sortable: true,
    minWidth: '140px',
    sortField: 'id',
    selector: row => row.quotation_number,
    cell: row => (
      <Link to={`/quotation/edit/${row.id}`} className='text-body'>
        <span className='fw-bolder'>{row.quotation_number}</span>
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
        <Link to={`/quotation/edit/${row.id}`} className='user_name text-truncate text-body'>
          <span className='fw-bolder'>{row.contact_name}</span>
        </Link>
        <small className='text-truncate text-muted mb-0'>{row.company_name || '-'}</small>
      </div>
    )
  },
  {
    name: 'Issue Date',
    minWidth: '140px',
    sortable: true,
    sortField: 'issue_date',
    selector: row => row.issue_date,
    cell: row => <span>{row.issue_date}</span>
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
        {currentUserCan('/quotation', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/quotation/edit/${row.id}`}
              id={`edit-tooltip-${row.id}`}
              className='btn-icon me-1'
              color='flat-primary'
              size='sm'
              style={{ borderRadius: '4px', backgroundColor: '#7367f01f' }}
            >
              <Edit2 size={16} className='text-primary' />
            </Button>
            <UncontrolledTooltip placement='top' target={`edit-tooltip-${row.id}`}>
              Edit
            </UncontrolledTooltip>
          </Fragment>
        )}

        {currentUserCan('/quotation', 'add') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/quotation/add?clone=${row.id}`}
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

        {currentUserCan('/quotation', 'delete') && (
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
                  text: `This will permanently delete the quotation for "${row.contact_name}".`,
                  onConfirm: () =>
                    store.dispatch(deleteQuotation(row.id)).then(() => toast.success('Quotation deleted'))
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
