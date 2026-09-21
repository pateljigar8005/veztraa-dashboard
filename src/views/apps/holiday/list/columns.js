import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deleteHoliday } from '../store'
import { Edit2, Trash2 } from 'react-feather'
import { Button, UncontrolledTooltip } from 'reactstrap'
import { formatDate } from '@utils'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

export const columns = [
  {
    name: 'Name',
    sortable: true,
    minWidth: '280px',
    sortField: 'name',
    selector: row => row.name,
    cell: row => (
      <Link to={`/holiday/edit/${row.id}`} className='user_name text-truncate text-body'>
        <span className='fw-bolder'>{row.name}</span>
      </Link>
    )
  },
  {
    name: 'Date',
    minWidth: '180px',
    sortable: true,
    sortField: 'date',
    selector: row => row.date,
    cell: row => {
      const [y, m, d] = row.date.split('-').map(Number)
      return <span>{formatDate(new Date(y, m - 1, d), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    }
  },
  {
    name: 'Actions',
    right: true,
    minWidth: '90px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/holiday', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/holiday/edit/${row.id}`}
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

        {currentUserCan('/holiday', 'delete') && (
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
                  onConfirm: () => store.dispatch(deleteHoliday(row.id)).unwrap().then(() => toast.success('Holiday deleted')).catch(err => toast.error(err?.message || 'Failed to delete'))
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