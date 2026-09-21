import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { store } from '@store/store'
import { toggleApiKey, deleteApiKey } from '../store'
import { Clock, Trash2 } from 'react-feather'
import { Button, Input, UncontrolledTooltip } from 'reactstrap'
import { formatDate } from '@utils'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

export const columns = [
  {
    name: 'Name',
    sortable: true,
    minWidth: '220px',
    sortField: 'name',
    selector: row => row.name,
    cell: row => <span className='fw-bolder'>{row.name}</span>
  },
  {
    name: 'Key',
    minWidth: '140px',
    selector: row => row.token_hint,
    cell: row => <span className='font-monospace text-muted'>{row.token_hint}</span>
  },
  {
    name: 'Status',
    minWidth: '110px',
    selector: row => row.is_active,
    cell: row => (
      <div className='form-switch'>
        <Input
          type='switch'
          checked={row.is_active}
          disabled={!currentUserCan('/api-key', 'edit')}
          onChange={() =>
            store
              .dispatch(toggleApiKey(row.id))
              .unwrap()
              .then(() => toast.success(row.is_active ? 'API key disabled' : 'API key enabled'))
              .catch(err => toast.error(err?.message || 'Failed to update API key'))
          }
        />
      </div>
    )
  },
  {
    name: 'Total Hits',
    minWidth: '110px',
    selector: row => row.total_hits,
    cell: row => <span>{row.total_hits}</span>
  },
  {
    name: 'Last Used',
    minWidth: '160px',
    selector: row => row.last_used_at,
    cell: row => <span>{row.last_used_at ? formatDate(row.last_used_at, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</span>
  },
  {
    name: 'Created',
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
          to={`/api-key/${row.id}/logs`}
          id={`history-tooltip-${row.id}`}
          className='btn-icon me-1'
          color='flat-secondary'
          size='sm'
          style={{ borderRadius: '4px', backgroundColor: '#82868b1f' }}
        >
          <Clock size={16} className='text-secondary' />
        </Button>
        <UncontrolledTooltip placement='top' target={`history-tooltip-${row.id}`}>
          Access History
        </UncontrolledTooltip>

        {currentUserCan('/api-key', 'delete') && (
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
                  text: `This will permanently delete the API key "${row.name}". Any integration still using it will stop working.`,
                  onConfirm: () =>
                    store
                      .dispatch(deleteApiKey(row.id))
                      .unwrap()
                      .then(() => toast.success('API key deleted'))
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
