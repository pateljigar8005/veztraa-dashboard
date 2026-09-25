import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { store } from '@store/store'
import { deleteRole } from '../store'
import { Edit2, Trash2 } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import toast from 'react-hot-toast'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

const handleDelete = (id, name) => {
  confirmDelete({
    text: `This will permanently delete the role "${name}".`,
    onConfirm: () =>
      store
        .dispatch(deleteRole(id))
        .unwrap()
        .then(() => toast.success('Role deleted'))
        .catch(err => toast.error(err?.message || 'Failed to delete role'))
  })
}

export const columns = [
  {
    name: 'Role Name',
    sortable: true,
    minWidth: '280px',
    sortField: 'name',
    selector: row => row.name,
    cell: row => (
      <Link to={`/roles/edit/${row.id}`} className='user_name text-truncate text-body text-capitalize'>
        <span className='fw-bolder'>{row.name}</span>
      </Link>
    )
  },
  {
    name: 'Total Users',
    width: '170px',
    sortable: true,
    sortField: 'user_count',
    selector: row => row.user_count,
    cell: row => (
      <Badge className='text-capitalize' color='light-primary' pill>
        {row.user_count} user{row.user_count === 1 ? '' : 's'}
      </Badge>
    )
  },
  {
    name: 'Actions',
    right: true,
    width: '120px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/roles', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/roles/edit/${row.id}`}
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

        {currentUserCan('/roles', 'delete') && (
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
                handleDelete(row.id, row.name)
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