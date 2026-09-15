// ** React Imports
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Store & Actions
import { store } from '@store/store'
import { deleteClient } from '../store'

// ** Icons Imports
import { Edit2, FileText, Trash2 } from 'react-feather'

// ** Reactstrap Imports
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'

// ** Utils
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

// ** Renders Client Column
const renderClient = row => (
  <Avatar
    initials
    className='me-1'
    color={row.avatarColor || 'light-primary'}
    content={row.fullName || 'John Doe'}
  />
)

const statusObj = {
  pending: 'light-warning',
  active: 'light-success',
  inactive: 'light-secondary'
}

export const columns = [
  {
    name: 'Client',
    sortable: true,
    minWidth: '260px',
    sortField: 'fullName',
    selector: row => row.fullName,
    cell: row => (
      <div className='d-flex justify-content-left align-items-center' style={{ minWidth: 0 }}>
        {renderClient(row)}
        <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
          <Link to={`/client/view/${row.id}`} className='user_name text-truncate text-body' title={row.fullName}>
            <span className='fw-bolder'>{row.fullName}</span>
          </Link>
          <small className='text-truncate text-muted mb-0' title={row.email}>
            {row.email}
          </small>
        </div>
      </div>
    )
  },
  {
    name: 'Company',
    sortable: true,
    minWidth: '180px',
    sortField: 'company_name',
    selector: row => row.company_name,
    cell: row => <span className='text-truncate'>{row.company_name || '-'}</span>
  },
  {
    name: 'Industry',
    minWidth: '160px',
    sortable: true,
    sortField: 'industry_name',
    selector: row => row.industry_name,
    cell: row => <span>{row.industry_name || '-'}</span>
  },
  {
    name: 'Currency',
    minWidth: '130px',
    sortable: true,
    sortField: 'currency_name',
    selector: row => row.currency_name,
    cell: row => <span>{row.currency_name ? `${row.currency_name} (${row.currency_icon})` : '-'}</span>
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
    minWidth: '130px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        <Button
          tag={Link}
          to={`/client/view/${row.id}`}
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

        {currentUserCan('/client', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/client/edit/${row.id}`}
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

        {currentUserCan('/client', 'delete') && (
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
                  text: `This will permanently delete "${row.fullName}".`,
                  onConfirm: () => store.dispatch(deleteClient(row.id)).then(() => toast.success('Client deleted'))
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
