import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteEventCategory } from '../store'
import { Edit2, Trash2 } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

const statusObj = {
  active: 'light-success',
  inactive: 'light-secondary'
}

export const columns = [
  {
    name: 'Name',
    sortable: true,
    minWidth: '220px',
    sortField: 'name',
    selector: row => row.name,
    cell: row => (
      <Link to={`/event-category/edit/${row.id}`} className='user_name text-truncate text-body'>
        <span className='fw-bolder'>{row.name}</span>
      </Link>
    )
  },
  {
    name: 'Color',
    minWidth: '140px',
    selector: row => row.color,
    cell: row => (
      <Badge className='text-capitalize' color={row.color} pill>
        {row.color}
      </Badge>
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
    name: 'Created',
    minWidth: '160px',
    sortable: true,
    sortField: 'created_at',
    selector: row => row.created_at,
    cell: row => <span>{row.created_at}</span>
  },
  {
    name: 'Actions',
    right: true,
    minWidth: '90px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/event-category', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/event-category/edit/${row.id}`}
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

        {currentUserCan('/event-category', 'delete') && (
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
                    store.dispatch(deleteEventCategory(row.id)).then(() => toast.success('Event category deleted'))
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
