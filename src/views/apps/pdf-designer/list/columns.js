import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { deletePdfDesignerTemplate } from '../store'
import { Copy, Edit2, Trash2 } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

const typeLabels = {
  invoice: 'Invoice',
  quotation: 'Quotation',
  contract: 'Contract',
  other: 'Other'
}

export const columns = [
  {
    name: 'Name',
    sortable: true,
    minWidth: '260px',
    sortField: 'name',
    selector: row => row.name,
    cell: row => (
      <Link to={`/pdf-designer/edit/${row.id}`} className='user_name text-truncate text-body'>
        <span className='fw-bolder'>{row.name}</span>
      </Link>
    )
  },
  {
    name: 'Type',
    minWidth: '130px',
    sortable: true,
    sortField: 'type',
    selector: row => row.type,
    cell: row => <span className='text-capitalize'>{typeLabels[row.type] || row.type}</span>
  },
  {
    name: 'Status',
    minWidth: '110px',
    sortable: true,
    sortField: 'is_active',
    selector: row => row.is_active,
    cell: row => (
      <Badge color={row.is_active ? 'light-success' : 'light-secondary'} pill>
        {row.is_active ? 'Active' : 'Inactive'}
      </Badge>
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
    minWidth: '130px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/pdf-designer', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/pdf-designer/edit/${row.id}`}
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

        {currentUserCan('/pdf-designer', 'add') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/pdf-designer/add?clone=${row.id}`}
              id={`clone-tooltip-${row.id}`}
              className='btn-icon me-1'
              color='flat-secondary'
              size='sm'
              style={{ borderRadius: '4px', backgroundColor: '#82868b1f' }}
            >
              <Copy size={16} className='text-secondary' />
            </Button>
            <UncontrolledTooltip placement='top' target={`clone-tooltip-${row.id}`}>
              Clone
            </UncontrolledTooltip>
          </Fragment>
        )}

        {currentUserCan('/pdf-designer', 'delete') && (
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
                    store.dispatch(deletePdfDesignerTemplate(row.id)).unwrap().then(() => toast.success('PDF designer template deleted')).catch(err => toast.error(err?.message || 'Failed to delete'))
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