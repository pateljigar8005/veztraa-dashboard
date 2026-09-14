// ** React Imports
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Store & Actions
import { store } from '@store/store'
import { deleteTermsTemplate } from '../store'

// ** Icons Imports
import { Edit2, Trash2 } from 'react-feather'

// ** Reactstrap Imports
import { Button, UncontrolledTooltip } from 'reactstrap'

// ** Utils
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

export const columns = [
  {
    name: 'Name',
    sortable: true,
    minWidth: '300px',
    sortField: 'name',
    selector: row => row.name,
    cell: row => (
      <Link to={`/terms-template/edit/${row.id}`} className='user_name text-truncate text-body'>
        <span className='fw-bolder'>{row.name}</span>
      </Link>
    )
  },
  {
    name: 'Created',
    minWidth: '160px',
    sortable: true,
    sortField: 'created_at',
    selector: row => row.created_at,
    cell: row => <span>{row.created_at}</span>
  },
  {
    name: 'Actions',
    right: true,
    minWidth: '90px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/terms-template', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/terms-template/edit/${row.id}`}
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

        {currentUserCan('/terms-template', 'delete') && (
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
                    store.dispatch(deleteTermsTemplate(row.id)).then(() => toast.success('Terms Template deleted'))
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
