import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteContactSubmission } from '../store'
import { FileText, Trash2 } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import { formatDate } from '@utils'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

export const columns = [
  {
    name: 'From',
    sortable: true,
    minWidth: '260px',
    sortField: 'full_name',
    selector: row => row.full_name,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
        <Link to={`/contact-submission/view/${row.id}`} className='user_name text-truncate text-body' title={row.full_name}>
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
    name: 'Company',
    minWidth: '160px',
    sortable: true,
    sortField: 'company_name',
    selector: row => row.company_name,
    cell: row => <span className='text-truncate'>{row.company_name || '-'}</span>
  },
  {
    name: 'Service Required',
    minWidth: '180px',
    selector: row => row.service_required,
    cell: row => <span className='text-truncate'>{row.service_required || '-'}</span>
  },
  {
    name: 'Budget',
    minWidth: '140px',
    selector: row => row.project_budget,
    cell: row => <span>{row.project_budget || '-'}</span>
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
    name: 'Actions',
    right: true,
    minWidth: '100px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        <Button
          tag={Link}
          to={`/contact-submission/view/${row.id}`}
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

        {currentUserCan('/contact-submission', 'delete') && (
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
                  text: `This will permanently delete the submission from "${row.full_name}".`,
                  onConfirm: () =>
                    store
                      .dispatch(deleteContactSubmission(row.id))
                      .unwrap()
                      .then(() => toast.success('Contact submission deleted'))
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
