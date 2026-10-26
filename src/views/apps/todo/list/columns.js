import { Link } from 'react-router-dom'
import { MessageSquare, Paperclip } from 'react-feather'
import Avatar from '@components/avatar'
import { resolveAvatarUrl } from '@utils'
import { categoryLabels, issueNumber } from '../todoOptions'
import { StatusOptionLabel, PriorityBadge, SeverityBadge, formatDay } from '../IssueBits'

// Local YYYY-MM-DD - toISOString() is UTC and can be a day off.
const todayLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Mantis "View Issues" columns.
export const columns = [
  {
    name: 'ID',
    width: '110px',
    sortable: true,
    sortField: 'id',
    selector: row => row.id,
    cell: row => (
      <Link to={`/todo/view/${row.id}`} className='fw-bolder text-muted'>
        #{issueNumber(row.id)}
      </Link>
    )
  },
  {
    name: 'Summary',
    minWidth: '320px',
    grow: 3,
    sortable: true,
    sortField: 'title',
    selector: row => row.title,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden py-50' style={{ minWidth: 0 }}>
        <Link to={`/todo/view/${row.id}`} className='text-body fw-bolder text-truncate' title={row.title}>
          {row.title}
        </Link>
        <small className='text-muted text-truncate d-flex align-items-center' style={{ gap: '0.6rem' }}>
          <span className='text-truncate'>
            {row.project_name ? `${row.project_name} · ` : ''}
            {categoryLabels[row.category] || row.category}
          </span>
          {row.note_count > 0 && (
            <span className='d-inline-flex align-items-center flex-shrink-0' title={`${row.note_count} notes`}>
              <MessageSquare size={12} className='me-25' />
              {row.note_count}
            </span>
          )}
          {row.attachment_count > 0 && (
            <span className='d-inline-flex align-items-center flex-shrink-0' title={`${row.attachment_count} files`}>
              <Paperclip size={12} className='me-25' />
              {row.attachment_count}
            </span>
          )}
        </small>
      </div>
    )
  },
  {
    name: 'Assigned To',
    minWidth: '190px',
    sortable: true,
    sortField: 'handler',
    selector: row => row.assignees.map(a => a.full_name).join(', '),
    cell: row => {
      const people = row.assignees
      if (people.length === 0) return <span className='text-muted'>Unassigned</span>
      // One person: avatar + name. Several: overlapping avatars, first three.
      if (people.length === 1) {
        return (
          <div className='d-flex align-items-center overflow-hidden'>
            <Avatar initials size='sm' className='me-50 flex-shrink-0' color='light-primary' content={people[0].full_name} img={resolveAvatarUrl(people[0].avatar) || undefined} />
            <span className='text-truncate'>{people[0].full_name}</span>
          </div>
        )
      }
      return (
        <div className='d-flex align-items-center' title={people.map(p => p.full_name).join(', ')}>
          {people.slice(0, 3).map((p, i) => (
            <Avatar
              key={p.id}
              initials
              size='sm'
              color='light-primary'
              content={p.full_name}
              img={resolveAvatarUrl(p.avatar) || undefined}
              style={{ marginLeft: i === 0 ? 0 : -8, boxShadow: '0 0 0 2px var(--bs-body-bg, #fff)' }}
            />
          ))}
          {people.length > 3 && <small className='text-muted ms-50'>+{people.length - 3}</small>}
        </div>
      )
    }
  },
  {
    name: 'Priority',
    width: '130px',
    sortable: true,
    sortField: 'priority',
    selector: row => row.priority,
    cell: row => <PriorityBadge priority={row.priority} />
  },
  {
    name: 'Severity',
    width: '120px',
    sortable: true,
    sortField: 'severity',
    selector: row => row.severity,
    cell: row => <SeverityBadge severity={row.severity} />
  },
  {
    name: 'Status',
    width: '140px',
    sortable: true,
    sortField: 'status',
    selector: row => row.status,
    cell: row => <StatusOptionLabel status={row.status} />
  },
  {
    name: 'Due',
    width: '150px',
    sortable: true,
    sortField: 'due_date',
    selector: row => row.due_date,
    cell: row => {
      if (!row.due_date) return <span className='text-muted'>-</span>
      const overdue = !row.is_completed && row.due_date < todayLocal()
      return <span className={`text-nowrap ${overdue ? 'text-danger fw-bolder' : ''}`}>{formatDay(row.due_date)}</span>
    }
  }
]
