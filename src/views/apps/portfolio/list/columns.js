// ** React Imports
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Store & Actions
import { store } from '@store/store'
import { deletePortfolioItem } from '../store'

// ** Icons Imports
import { Edit2, Trash2, Star } from 'react-feather'

// ** Reactstrap Imports
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'

// ** Utils
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { resolveAvatarUrl } from '@utils'
import getInitials from '../../shared/getInitials'
import GripVerticalIcon from '../../shared/GripVerticalIcon'

const statusObj = {
  active: 'light-success',
  inactive: 'light-secondary'
}

// ** dragEnabled: true only while sorted by Display Order (asc) - see
// list/Table.js's useDragReorder call for why dragging is gated on that.
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
    name: 'Project',
    sortable: true,
    minWidth: '280px',
    sortField: 'title',
    selector: row => row.title,
    cell: row => (
      <div className='d-flex justify-content-left align-items-center' style={{ minWidth: 0 }}>
        {row.image ? (
          <Avatar className='me-1' imgClassName='rounded-0' img={resolveAvatarUrl(row.image)} width='32' height='32' />
        ) : (
          <Avatar
            className='me-1'
            color='light-primary'
            content={getInitials(row.title) || 'PI'}
            contentStyles={{ borderRadius: 0 }}
          />
        )}
        <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
          <div className='d-flex align-items-center' style={{ minWidth: 0 }}>
            <Link
              to={`/portfolio/edit/${row.id}`}
              className='user_name text-truncate text-body'
              title={row.title}
              style={{ minWidth: 0 }}
            >
              <span className='fw-bolder'>{row.title}</span>
            </Link>
            {row.is_featured ? (
              <Star size={12} className='text-warning ms-50 flex-shrink-0' fill='currentColor' />
            ) : null}
          </div>
          <small className='text-truncate text-muted mb-0' title={row.client_name}>
            {row.client_name || '-'}
          </small>
        </div>
      </div>
    )
  },
  {
    name: 'Category',
    minWidth: '160px',
    sortable: true,
    sortField: 'category',
    selector: row => row.category,
    cell: row => <span>{row.category || '-'}</span>
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
    minWidth: '90px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/portfolio', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/portfolio/edit/${row.id}`}
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

        {currentUserCan('/portfolio', 'delete') && (
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
                    store.dispatch(deletePortfolioItem(row.id)).then(() => toast.success('Portfolio item deleted'))
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
