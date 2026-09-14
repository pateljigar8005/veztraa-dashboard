// ** React Imports
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Store & Actions
import { store } from '@store/store'
import { deleteProject } from '../store'

// ** Icons Imports
import { Edit2, Trash2 } from 'react-feather'

// ** Reactstrap Imports
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'

// ** Utils
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

// ** Options
import { statusOptions } from '../statusOptions'

const statusColorObj = {
  planning: 'light-info',
  in_progress: 'light-warning',
  on_hold: 'light-secondary',
  completed: 'light-success',
  cancelled: 'light-danger'
}

const statusLabel = value => statusOptions.find(i => i.value === value)?.label || value || '-'

export const columns = [
  {
    name: 'Project',
    sortable: true,
    minWidth: '240px',
    sortField: 'name',
    selector: row => row.name,
    cell: row => (
      <div className='d-flex flex-column'>
        <Link to={`/project/edit/${row.id}`} className='user_name text-truncate text-body'>
          <span className='fw-bolder'>{row.name}</span>
        </Link>
        <small className='text-truncate text-muted mb-0'>{row.client_name || '-'}</small>
      </div>
    )
  },
  {
    name: 'Start Date',
    minWidth: '140px',
    sortable: true,
    sortField: 'start_date',
    selector: row => row.start_date,
    cell: row => <span>{row.start_date || '-'}</span>
  },
  {
    name: 'Budget',
    minWidth: '140px',
    sortable: true,
    sortField: 'budget',
    selector: row => row.budget,
    cell: row => <span>{row.budget !== null ? `$${Number(row.budget).toFixed(2)}` : '-'}</span>
  },
  {
    name: 'Status',
    minWidth: '140px',
    sortable: true,
    sortField: 'status',
    selector: row => row.status,
    cell: row => (
      <Badge className='text-capitalize' color={statusColorObj[row.status] || 'light-secondary'} pill>
        {statusLabel(row.status)}
      </Badge>
    )
  },
  {
    name: 'Actions',
    right: true,
    minWidth: '90px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/project', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/project/edit/${row.id}`}
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

        {currentUserCan('/project', 'delete') && (
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
                  onConfirm: () => store.dispatch(deleteProject(row.id)).then(() => toast.success('Project deleted'))
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
