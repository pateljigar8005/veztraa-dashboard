// ** React Imports
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Store & Actions
import { store } from '@store/store'
import { deleteServiceItem } from '../store'

// ** Icons Imports
import { Edit2, Trash2 } from 'react-feather'

// ** Reactstrap Imports
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'

// ** Utils
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

// ** Options
import { categoryOptions, unitOptions } from '../serviceItemOptions'

const statusObj = {
  active: 'light-success',
  inactive: 'light-secondary'
}

const categoryLabel = value => categoryOptions.find(i => i.value === value)?.label || value || '-'
const unitLabel = value => unitOptions.find(i => i.value === value)?.label || value || '-'

export const columns = [
  {
    name: 'Name',
    sortable: true,
    minWidth: '240px',
    sortField: 'name',
    selector: row => row.name,
    cell: row => (
      <div className='d-flex flex-column'>
        <Link to={`/service-item/edit/${row.id}`} className='user_name text-truncate text-body'>
          <span className='fw-bolder'>{row.name}</span>
        </Link>
        <small className='text-truncate text-muted mb-0'>{row.description || '-'}</small>
      </div>
    )
  },
  {
    name: 'Category',
    minWidth: '160px',
    sortable: true,
    sortField: 'category',
    selector: row => row.category,
    cell: row => <span>{categoryLabel(row.category)}</span>
  },
  {
    name: 'Price',
    minWidth: '160px',
    sortable: true,
    sortField: 'price',
    selector: row => row.price,
    cell: row => (
      <span>
        ${Number(row.price).toFixed(2)} <span className='text-muted'>/ {unitLabel(row.unit)}</span>
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
      <Badge className='text-capitalize' color={statusObj[row.status]} pill>
        {row.status}
      </Badge>
    )
  },
  {
    name: 'Actions',
    right: true,
    minWidth: '90px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/service-item', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/service-item/edit/${row.id}`}
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

        {currentUserCan('/service-item', 'delete') && (
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
                  text: `This will permanently delete "${row.name}".`,
                  onConfirm: () =>
                    store.dispatch(deleteServiceItem(row.id)).then(() => toast.success('Service Item deleted'))
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
