import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Avatar from '@components/avatar'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Bell, Mail, Send, CheckSquare, X } from 'react-feather'
import { Badge, Button, DropdownMenu, DropdownItem, DropdownToggle, UncontrolledDropdown, Spinner } from 'reactstrap'
import { dismissNotification, dismissAllNotifications } from '@store/notifications'

// Real data from GET /notifications (see src/redux/notifications.js,
// polled by useNotificationPolling.js) - the API already permission-gates
// and own-records-scopes everything in it, so this just renders whatever
// came back. "Mark all as read"/per-item dismiss both go through
// NotificationDismissal server-side (see NotificationController::dismiss()/
// dismissAll()) - a contact/job_application item's dismiss is its real
// is_read flag, and a todo_overdue item's dismiss is fingerprinted to its
// current due_date, so it resurfaces on its own if that date changes
// instead of staying hidden forever.
const TYPE_META = {
  contact: { icon: <Mail size={14} />, color: 'primary' },
  job_application: { icon: <Send size={14} />, color: 'info' },
  todo_overdue: { icon: <CheckSquare size={14} />, color: 'danger' }
}

// item.date is either a full 'YYYY-MM-DD HH:MM:SS' (contact/job_application,
// from created_at) or a bare 'YYYY-MM-DD' (todo_overdue, from due_date) -
// a bare date string parses as UTC midnight in JS and can
// silently shift by a day depending on the browser's local timezone (see
// CLAUDE.md's date-math note), so it's always given an explicit local time
// instead of being handed to `new Date()` as-is.
const relativeTime = value => {
  const isoLocal = value.length > 10 ? value.replace(' ', 'T') : `${value}T00:00:00`
  const diffMs = Date.now() - new Date(isoLocal).getTime()
  const diffHours = Math.round(diffMs / 3600000)
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

const NotificationDropdown = () => {
  const dispatch = useDispatch()
  const { count, items } = useSelector(state => state.notifications)
  const [clearingAll, setClearingAll] = useState(false)
  const [dismissingKey, setDismissingKey] = useState(null)

  const handleDismiss = (e, item) => {
    // Stop the click from also following the surrounding <Link> - dismiss
    // clears the item in place, it shouldn't also navigate away.
    e.preventDefault()
    e.stopPropagation()
    const key = `${item.type}-${item.id}`
    setDismissingKey(key)
    dispatch(dismissNotification({ type: item.type, id: item.id })).finally(() => setDismissingKey(null))
  }

  const handleClearAll = () => {
    setClearingAll(true)
    dispatch(dismissAllNotifications()).finally(() => setClearingAll(false))
  }

  return (
    <UncontrolledDropdown tag='li' className='dropdown-notification nav-item me-25'>
      <DropdownToggle tag='a' className='nav-link' href='/' onClick={e => e.preventDefault()}>
        <Bell size={21} />
        {count > 0 && (
          <Badge pill color='danger' className='badge-up'>
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </DropdownToggle>
      <DropdownMenu end tag='ul' className='dropdown-menu-media mt-0'>
        <li className='dropdown-menu-header'>
          <DropdownItem className='d-flex align-items-center' tag='div' header>
            <h4 className='notification-title mb-0 me-auto'>Notifications</h4>
            {count > 0 && (
              <Badge tag='div' className='me-1' color='light-primary' pill>
                {count} New
              </Badge>
            )}
            {count > 0 && (
              <Button
                color='link'
                size='sm'
                className='p-0'
                disabled={clearingAll}
                onClick={handleClearAll}
              >
                {clearingAll ? <Spinner size='sm' /> : 'Mark all as read'}
              </Button>
            )}
          </DropdownItem>
        </li>
        {items.length === 0 ? (
          <li className='p-2 text-center text-muted'>You're all caught up.</li>
        ) : (
          <PerfectScrollbar component='li' className='media-list scrollable-container' options={{ wheelPropagation: false }}>
            {items.map(item => {
              const meta = TYPE_META[item.type]
              const key = `${item.type}-${item.id}`
              return (
                <Link key={key} className='d-flex' to={meta ? item.path : '/'}>
                  <div className='list-item d-flex align-items-start'>
                    <div className='me-1'>
                      <Avatar icon={meta?.icon} color={meta?.color || 'secondary'} />
                    </div>
                    <div className='list-item-body flex-grow-1' style={{ minWidth: 0 }}>
                      {/* Time sits on the title line, right-aligned next to
                          the dismiss X, rather than on a line of its own. */}
                      <p className='media-heading d-flex align-items-center'>
                        <span className='fw-bolder text-truncate me-auto'>{item.title}</span>
                        <small className='text-muted text-nowrap ms-50'>{relativeTime(item.date)}</small>
                      </p>
                      {/* mb-0: the theme's .notification-text margin was there
                          to space it from the time line that used to follow. */}
                      <small className='notification-text d-block text-truncate mb-0'>{item.subtitle}</small>
                    </div>
                    <Button
                      color='flat-secondary'
                      size='sm'
                      className='btn-icon p-0 ms-50'
                      disabled={dismissingKey === key}
                      onClick={e => handleDismiss(e, item)}
                      title='Dismiss'
                    >
                      {dismissingKey === key ? <Spinner size='sm' /> : <X size={14} />}
                    </Button>
                  </div>
                </Link>
              )
            })}
          </PerfectScrollbar>
        )}
      </DropdownMenu>
    </UncontrolledDropdown>
  )
}

export default NotificationDropdown
