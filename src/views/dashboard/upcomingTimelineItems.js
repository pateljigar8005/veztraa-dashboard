import { CheckSquare, Calendar, Sun, FileText } from 'react-feather'
import Avatar from '@components/avatar'
import { formatAmount } from '@utils'

// Shared by UserTimelineCard.js (the sidebar Upcoming block was removed as
// a duplicate of this card) so item styling/paths stay in one place.
export const TYPE_META = {
  todo: { icon: <CheckSquare size={12} />, color: 'info', path: id => `/todo?task=${id}`, label: 'Todo' },
  calendar: { icon: <Calendar size={12} />, color: 'warning', path: () => '/calendar', label: 'Event' },
  holiday: { icon: <Sun size={12} />, color: 'secondary', path: id => `/holiday/edit/${id}`, label: 'Holiday' },
  invoice: { icon: <FileText size={12} />, color: 'primary', path: id => `/invoice/view/${id}`, label: 'Invoice' }
}

// Rich "Client Meeting"-style row (avatar + name + amount) instead of a
// plain text line, for invoice items in the User Timeline card.
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
