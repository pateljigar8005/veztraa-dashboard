import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteProject } from '../store'
import { Edit2, Trash2 } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { formatAmount } from '@utils'
import { statusOptions } from '../statusOptions'
import { budgetTypeOptions } from '../budgetTypeOptions'

const statusColorObj = {
  planning: 'light-info',
  in_progress: 'light-warning',
  on_hold: 'light-secondary',
  completed: 'light-success',
  cancelled: 'light-danger'
}

const statusLabel = value => statusOptions.find(i => i.value === value)?.label || value || '-'
const budgetTypeLabel = value => budgetTypeOptions.find(i => i.value === value)?.label || null

export const columns = [
  {
    name: 'Project',
    sortable: true,
    minWidth: '240px',
    sortField: 'name',
    selector: row => row.name,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
        <Link to={`/project/edit/${row.id}`} className='user_name text-truncate text-body' title={row.name}>
          <span className='fw-bolder'>{row.name}</span>
        </Link>
        <small className='text-truncate text-muted mb-0' title={row.client_name || '-'}>
          {row.client_name || '-'}
        </small>
      </div>
    )
  },
  {
    name: 'Start Date',
    width: '150px',
    sortable: true,
    sortField: 'start_date',
    selector: row => row.start_date,
    cell: row => <span>{row.start_date || '-'}</span>
  },
  {
    name: 'Budget',
    width: '160px',
    sortable: true,
    sortField: 'budget',
    selector: row => row.budget,
    cell: row => (
      <div className='d-flex flex-column' style={{ minWidth: 0 }}>
        <span>{row.budget !== null ? `${row.currency || '$'} ${formatAmount(row.budget)}` : '-'}</span>
        {row.budget !== null && budgetTypeLabel(row.budget_type) && (
          <small className='text-muted'>{budgetTypeLabel(row.budget_type)}</small>
        )}
      </div>
    )
  },
  {
    name: 'Status',
    width: '150px',
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
    width: '120px',
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
                  onConfirm: () => store.dispatch(deleteProject(row.id)).unwrap().then(() => toast.success('Project deleted')).catch(err => toast.error(err?.message || 'Failed to delete'))
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