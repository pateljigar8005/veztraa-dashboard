import toast from 'react-hot-toast'
import { Trash2 } from 'react-feather'
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'
import { store } from '@store/store'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { deleteActivityLog } from '../store'
import { formatEntityType, describeActivityRow, ActivityLines, ActivityDateTime } from '@src/utility/activityLogFormat'

// Same Description / User / Date & Time / Status layout as the per-record
// History popup (HistoryModal.js), so a row reads the same whether it's
// opened from a detail page or from here. The only addition is the
// record line on top of each description - this page spans every module,
// so "Status: Draft → Sent" alone wouldn't say which record it was.
//
// sortField values are ActivityLog::SORTABLE keys (server-side sort), not
// the client-side keys HistoryModal sorts its own in-memory rows by.
export const columns = [
  {
    name: 'Description',
    sortField: 'entity_type',
    sortable: true,
    minWidth: '320px',
    selector: row => row.entity_type,
    cell: row => {
      const { lines } = describeActivityRow(row)
      return (
        <div style={{ minWidth: 0 }}>
          <div className='fw-bolder text-truncate' title={row.entity_label || ''}>
            {formatEntityType(row.entity_type)}
            {row.entity_label && (
              <span className='fw-normal text-body' style={{ opacity: 0.75 }}>
                {' '}
                &middot; {row.entity_label}
              </span>
            )}
          </div>
          <ActivityLines lines={lines} />
        </div>
      )
    }
  },
  {
    // Fixed widths keep these three out of the flex-grow split, so
    // Description absorbs all the remaining space (same as HistoryModal).
    name: 'User',
    right: true,
    width: '160px',
    selector: row => row.user_name || '',
    cell: row => (
      <div className='d-flex flex-column align-items-end overflow-hidden' style={{ minWidth: 0 }}>
        <span className='text-truncate'>{row.user_name || 'System'}</span>
        {row.user_role && <small className='text-muted text-capitalize'>{row.user_role}</small>}
      </div>
    )
  },
  {
    name: 'Date & Time',
    sortField: 'created_at',
    sortable: true,
    right: true,
    width: '180px',
    selector: row => row.created_at,
    cell: row => <ActivityDateTime value={row.created_at} />
  },
  {
    name: 'Status',
    sortField: 'action',
    sortable: true,
    right: true,
    width: '110px',
    selector: row => row.action,
    cell: row => {
      const { badgeLabel, badgeColor } = describeActivityRow(row)
      return (
        <Badge color={badgeColor} pill>
          {badgeLabel}
        </Badge>
      )
    }
  },
  {
    name: 'Actions',
    right: true,
    width: '90px',
    cell: row =>
      currentUserCan('/activity-log', 'delete') && (
        <div className='column-action d-flex align-items-center'>
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
                text: 'This will permanently delete this activity log entry.',
                onConfirm: () =>
                  store
                    .dispatch(deleteActivityLog(row.id))
                    .unwrap()
                    .then(() => toast.success('Activity log deleted'))
                    .catch(err => toast.error(err?.message || 'Failed to delete'))
              })
            }}
          >
            <Trash2 size={16} className='text-danger' />
          </Button>
          <UncontrolledTooltip placement='top' target={`delete-tooltip-${row.id}`}>
            Delete
          </UncontrolledTooltip>
        </div>
      )
  }
]
