// ** React Imports
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Store & Actions
import { store } from '@store/store'
import { deleteTeamMember } from '../store'

// ** Icons Imports
import { Edit2, Trash2 } from 'react-feather'

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
    name: 'Member',
    sortable: true,
    minWidth: '260px',
    sortField: 'full_name',
    selector: row => row.full_name,
    cell: row => (
      <div className='d-flex justify-content-left align-items-center' style={{ minWidth: 0 }}>
        {row.photo ? (
          <Avatar className='me-1' img={resolveAvatarUrl(row.photo)} width='32' height='32' />
        ) : (
          <Avatar className='me-1' color='light-primary' content={getInitials(row.full_name) || 'TM'} />
        )}
        <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
          <Link to={`/team-member/edit/${row.id}`} className='user_name text-truncate text-body' title={row.full_name}>
            <span className='fw-bolder'>{row.full_name}</span>
          </Link>
          <small className='text-truncate text-muted mb-0' title={row.role_title}>
            {row.role_title}
          </small>
        </div>
      </div>
    )
  },
  {
    name: 'Email',
    minWidth: '200px',
    selector: row => row.email,
    cell: row => <span>{row.email || '-'}</span>
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
        {currentUserCan('/team-member', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/team-member/edit/${row.id}`}
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

        {currentUserCan('/team-member', 'delete') && (
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
                  text: `This will permanently delete "${row.full_name}".`,
                  onConfirm: () =>
                    store.dispatch(deleteTeamMember(row.id)).then(() => toast.success('Team member deleted'))
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
