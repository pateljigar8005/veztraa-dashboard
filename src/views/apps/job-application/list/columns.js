import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteJobApplication } from '../store'
import { FileText, Trash2 } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import { formatDate } from '@utils'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

// See job_applications.status - New -> Reviewing -> Shortlisted -> Rejected/Hired.
const statusColorObj = {
  new: 'light-primary',
  reviewing: 'light-info',
  shortlisted: 'light-warning',
  rejected: 'light-danger',
  hired: 'light-success'
}

const statusLabelObj = {
  new: 'New',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired'
}

export const columns = [
  {
    name: 'Applicant',
    sortable: true,
    minWidth: '260px',
    sortField: 'full_name',
    selector: row => row.full_name,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
        <Link to={`/job-application/view/${row.id}`} className='user_name text-truncate text-body' title={row.full_name}>
          <span className='fw-bolder'>{row.full_name}</span>
          {!row.is_read && (
            <Badge className='ms-50' color='primary' pill>
              New
            </Badge>
          )}
        </Link>
        <small className='text-truncate text-muted mb-0' title={row.email}>
          {row.email}
        </small>
      </div>
    )
  },
  {
    name: 'Area of Expertise',
    minWidth: '200px',
    sortable: true,
    sortField: 'area_of_expertise',
    selector: row => row.area_of_expertise,
    cell: row => <span className='text-truncate'>{row.area_of_expertise}</span>
  },
  {
    name: 'Phone',
    minWidth: '140px',
    selector: row => row.phone,
    cell: row => <span>{row.phone || '-'}</span>
  },
  {
    name: 'Submitted',
    minWidth: '160px',
    sortable: true,
    sortField: 'created_at',
    selector: row => row.created_at,
    cell: row => <span>{formatDate(row.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
  },
  {
    name: 'Status',
    minWidth: '130px',
    selector: row => row.status,
    cell: row => (
      <Badge className='text-capitalize' color={statusColorObj[row.status] || 'light-secondary'} pill>
        {statusLabelObj[row.status] || row.status}
      </Badge>
    )
  },
  {
    name: 'Actions',
    right: true,
    minWidth: '100px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        <Button
          tag={Link}
          to={`/job-application/view/${row.id}`}
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

        {currentUserCan('/job-application', 'delete') && (
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
                  text: `This will permanently delete the application from "${row.full_name}".`,
                  onConfirm: () =>
                    store
                      .dispatch(deleteJobApplication(row.id))
                      .unwrap()
                      .then(() => toast.success('Job application deleted'))
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
