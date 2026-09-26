import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteJobListing } from '../store'
import { Edit2, Trash2 } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import GripVerticalIcon from '../../shared/GripVerticalIcon'

const statusObj = {
  active: 'light-success',
  inactive: 'light-secondary'
}

export const getColumns = dragEnabled => [
  {
    name: '',
    width: '56px',
    minWidth: '56px',
    center: true,
    cell: () => (
      <GripVerticalIcon
        size={22}
        className='drag-handle text-muted'
        style={{ cursor: dragEnabled ? 'grab' : 'not-allowed', opacity: dragEnabled ? 1 : 0.35 }}
      />
    )
  },
  {
    name: 'Job Title',
    sortable: true,
    minWidth: '260px',
    sortField: 'title',
    selector: row => row.title,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
        <Link to={`/job-listing/edit/${row.id}`} className='user_name text-truncate text-body' title={row.title}>
          <span className='fw-bolder'>{row.title}</span>
        </Link>
        <small className='text-truncate text-muted mb-0' title={row.location}>
          {row.location || '-'}
        </small>
      </div>
    )
  },
  {
    name: 'Positions',
    width: '150px',
    sortable: true,
    sortField: 'positions',
    selector: row => row.positions,
    cell: row => <span>{row.positions}</span>
  },
  {
    name: 'Status',
    width: '130px',
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
    width: '120px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/job-listing', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/job-listing/edit/${row.id}`}
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

        {currentUserCan('/job-listing', 'delete') && (
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
                  text: `This will permanently delete "${row.title}".`,
                  onConfirm: () =>
                    store.dispatch(deleteJobListing(row.id)).unwrap().then(() => toast.success('Job listing deleted')).catch(err => toast.error(err?.message || 'Failed to delete'))
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
