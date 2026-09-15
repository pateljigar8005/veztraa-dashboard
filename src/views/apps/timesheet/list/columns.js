// ** React Imports
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Store & Actions
import { store } from '@store/store'
import { deleteTimesheet } from '../store'

// ** Icons Imports
import { Edit2, Trash2 } from 'react-feather'

// ** Reactstrap Imports
import { Button, UncontrolledTooltip } from 'reactstrap'

// ** Utils
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { resolveAvatarUrl, htmlToString } from '@utils'

// ** Renders the User column's avatar + name
const renderUser = row => {
  if (row.user_avatar && row.user_avatar.length) {
    return <Avatar className='me-1' img={resolveAvatarUrl(row.user_avatar)} width='32' height='32' />
  }
  return <Avatar initials className='me-1' color='light-primary' content={row.user_name || 'User'} />
}

export const columns = [
  {
    name: 'User',
    sortable: true,
    minWidth: '220px',
    sortField: 'user_name',
    selector: row => row.user_name,
    cell: row => (
      <Link to={`/timesheet/edit/${row.id}`} className='d-flex align-items-center text-body'>
        {renderUser(row)}
        <span className='fw-bolder text-truncate'>{row.user_name}</span>
      </Link>
    )
  },
  {
    name: 'Project',
    sortable: true,
    minWidth: '180px',
    sortField: 'project_name',
    selector: row => row.project_name,
    cell: row => <span className='text-truncate'>{row.project_name}</span>
  },
  {
    name: 'Date',
    minWidth: '130px',
    sortable: true,
    sortField: 'date',
    selector: row => row.date,
    cell: row => <span>{row.date}</span>
  },
  {
    name: 'Activity',
    minWidth: '150px',
    sortable: true,
    sortField: 'activity_name',
    selector: row => row.activity_name,
    cell: row => <span>{row.activity_name}</span>
  },
  {
    name: 'Hours',
    minWidth: '100px',
    sortable: true,
    sortField: 'hours',
    selector: row => row.hours,
    cell: row => <span>{row.hours}</span>
  },
  {
    name: 'Description',
    minWidth: '200px',
    selector: row => row.description,
    cell: row => {
      const plain = row.description ? htmlToString(row.description) : ''
      return (
        <span className='text-truncate' title={plain}>
          {plain || '-'}
        </span>
      )
    }
  },
  {
    name: 'Actions',
    right: true,
    minWidth: '90px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/timesheet', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/timesheet/edit/${row.id}`}
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

        {currentUserCan('/timesheet', 'delete') && (
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
                  text: 'This will permanently delete this timesheet entry.',
                  onConfirm: () => store.dispatch(deleteTimesheet(row.id)).then(() => toast.success('Timesheet entry deleted'))
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
