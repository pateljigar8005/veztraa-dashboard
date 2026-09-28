import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteVendorBill, markVendorBillPaid } from '../store'
import { Edit2, Trash2, Check } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { formatAmount } from '@utils'
import { getCachedThemeColor } from '@src/utility/themeColor'

const statusColorObj = {
  unpaid: 'light-warning',
  paid: 'light-success'
}

export const columns = [
  {
    name: 'Vendor',
    sortable: true,
    minWidth: '220px',
    sortField: 'vendor_name',
    selector: row => row.vendor_name,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
        <Link to={`/vendor-bill/edit/${row.id}`} className='user_name text-truncate text-body' title={row.vendor_name}>
          <span className='fw-bolder'>{row.vendor_name}</span>
        </Link>
        {row.bill_number && <small className='text-muted'>{row.bill_number}</small>}
      </div>
    )
  },
  {
    name: 'Project',
    minWidth: '150px',
    selector: row => row.project_name,
    cell: row => <span>{row.project_name || '-'}</span>
  },
  { name: 'Bill Date', width: '130px', sortable: true, sortField: 'bill_date', selector: row => row.bill_date },
  { name: 'Due Date', width: '130px', sortable: true, sortField: 'due_date', selector: row => row.due_date },
  {
    name: 'Amount',
    width: '140px',
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
    name: 'Status',
    width: '120px',
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
    width: '160px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {row.status === 'unpaid' && currentUserCan('/vendor-bill', 'edit') && (
          <Fragment>
            <Button
              id={`mark-paid-tooltip-${row.id}`}
              className='btn-icon me-1'
              color='flat-success'
              size='sm'
              style={{ borderRadius: '4px', backgroundColor: '#28c76f1f' }}
              onClick={() =>
                store.dispatch(markVendorBillPaid(row.id)).unwrap().then(() => toast.success('Vendor bill marked as paid')).catch(err => toast.error(err?.response?.data?.message || 'Failed to update'))
              }
            >
              <Check size={16} className='text-success' />
            </Button>
            <UncontrolledTooltip placement='top' target={`mark-paid-tooltip-${row.id}`}>
              Mark Paid
            </UncontrolledTooltip>
          </Fragment>
        )}

        {currentUserCan('/vendor-bill', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/vendor-bill/edit/${row.id}`}
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

        {currentUserCan('/vendor-bill', 'delete') && (
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
                  text: `This will permanently delete this bill from "${row.vendor_name}".`,
                  onConfirm: () =>
                    store.dispatch(deleteVendorBill(row.id)).unwrap().then(() => toast.success('Vendor bill deleted')).catch(err => toast.error(err?.message || 'Failed to delete'))
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
