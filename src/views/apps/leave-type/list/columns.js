import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteLeaveType } from '../store'
import { Edit2, Trash2 } from 'react-feather'
import { Button, UncontrolledTooltip, Badge } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

export const columns = [
  {
    name: 'Name',
    sortable: true,
    minWidth: '220px',
    sortField: 'name',
    selector: row => row.name,
    cell: row => (
      <Link to={`/leave-type/edit/${row.id}`} className='user_name text-truncate text-body'>
        <span className='fw-bolder' style={{ borderLeft: `3px solid ${row.color}`, paddingLeft: '8px' }}>
          {row.name}
        </span>
      </Link>
    )
  },
  {
    name: 'Paid',
    width: '110px',
    cell: row => <Badge color={row.is_paid ? 'light-success' : 'light-secondary'}>{row.is_paid ? 'Paid' : 'Unpaid'}</Badge>
  },
  {
    name: 'Affects PL Balance',
    width: '170px',
    cell: row => (
      <Badge color={row.affects_balance ? 'light-primary' : 'light-secondary'}>
        {row.affects_balance ? 'Yes' : 'No'}
      </Badge>
    )
  },
  {
    name: 'Status',
    width: '110px',
    cell: row => <Badge color={row.is_active ? 'light-success' : 'light-secondary'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>
  },
  {
    name: 'Actions',
    right: true,
    width: '120px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/leave-type', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/leave-type/edit/${row.id}`}
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

        {currentUserCan('/leave-type', 'delete') && (
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
                    store
                      .dispatch(deleteLeaveType(row.id))
                      .unwrap()
                      .then(() => toast.success('Leave type deleted'))
                      .catch(err => toast.error(err?.message || 'Failed to delete'))
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
