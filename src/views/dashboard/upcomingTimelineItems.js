import { Link } from 'react-router-dom'
import { CheckSquare, Calendar, Sun, FileText } from 'react-feather'
import { Badge } from 'reactstrap'
import Avatar from '@components/avatar'
import { formatAmount } from '@utils'
import { priorityColors } from '../apps/todo/todoOptions'

// Shared by UpcomingCard.js (sidebar) and UserTimelineCard.js so both
// widgets render the same merged todo/calendar/holiday/invoice feed
// identically - one mapping to keep them from drifting apart.
export const TYPE_META = {
  todo: { icon: <CheckSquare size={12} />, color: 'info', path: id => `/todo?task=${id}`, label: 'Todo' },
  calendar: { icon: <Calendar size={12} />, color: 'warning', path: () => '/calendar', label: 'Event' },
  holiday: { icon: <Sun size={12} />, color: 'secondary', path: id => `/holiday/edit/${id}`, label: 'Holiday' },
  invoice: { icon: <FileText size={12} />, color: 'primary', path: id => `/invoice/view/${id}`, label: 'Invoice' }
}

// Rich "Client Meeting"-style row (avatar + name + amount) instead of a
// plain text line, for invoice items - both timeline widgets share it.
// clientName falls back to a fixed string - Avatar's initials mode calls
// .split(' ') on it and a null/empty value crashed the whole dashboard
// (an invoice with no company_name and no contact_name slipped through).
export const invoiceCustomContent = item => {
  const clientName = item.clientName || 'Client'
  return (
    <div className='d-flex align-items-center mt-50'>
      <Avatar color='light-primary' content={clientName} initials />
      <div className='ms-50'>
        <h6 className='mb-0'>{clientName}</h6>
        <span className='text-muted'>
          {item.currency}
          {formatAmount(item.amount)}
        </span>
      </div>
    </div>
  )
}

export const relativeLabel = value => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(`${value}T00:00:00`)
  const days = Math.round((date - today) / 86400000)

  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1 && days < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export const toUpcomingTimelineItems = items =>
  items
    .filter(item => TYPE_META[item.type])
    .map(item => {
      const meta = TYPE_META[item.type]
      return {
        title: (
          <Link to={meta.path(item.id)} className='text-body'>
            {item.title}
          </Link>
        ),
        meta: item.overdue ? 'Overdue' : relativeLabel(item.date),
        metaClassName: item.overdue ? 'text-danger fw-bolder' : '',
        color: item.overdue ? 'danger' : item.color || meta.color,
        icon: meta.icon,
        content: (
          <span className='text-muted'>
            {meta.label}
            {item.meta && (
              <Badge color={priorityColors[item.meta] || 'secondary'} pill className='text-capitalize ms-50'>
                {item.meta}
              </Badge>
            )}
          </span>
        ),
        customContent: item.type === 'invoice' ? invoiceCustomContent(item) : undefined
      }
    })
