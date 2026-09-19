import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Avatar from '@components/avatar'
import { store } from '@store/store'
import { deleteCaseStudy } from '../store'
import { Edit2, Trash2, Star } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { resolveAvatarUrl } from '@utils'
import getInitials from '../../shared/getInitials'
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
    name: 'Case Study',
    sortable: true,
    minWidth: '280px',
    sortField: 'title',
    selector: row => row.title,
    cell: row => (
      <div className='d-flex justify-content-left align-items-center' style={{ minWidth: 0 }}>
        {row.cover_image ? (
          <Avatar className='me-1' imgClassName='rounded-0' img={resolveAvatarUrl(row.cover_image)} width='32' height='32' />
        ) : (
          <Avatar
            className='me-1'
            color='light-primary'
            content={getInitials(row.title) || 'CS'}
            contentStyles={{ borderRadius: 0 }}
          />
        )}
        <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
          <div className='d-flex align-items-center' style={{ minWidth: 0 }}>
            <Link
              to={`/case-study/edit/${row.id}`}
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
          <small className='text-truncate text-muted mb-0' title={row.slug}>
            /case-studies/{row.slug}
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
        {currentUserCan('/case-study', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/case-study/edit/${row.id}`}
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

        {currentUserCan('/case-study', 'delete') && (
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
                    store.dispatch(deleteCaseStudy(row.id)).then(() => toast.success('Case study deleted'))
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