import { useState } from 'react'
import classnames from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Avatar from '@components/avatar'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Bell, Mail, Send, CheckSquare, AtSign, X } from 'react-feather'
import { Badge, Button, DropdownMenu, DropdownItem, DropdownToggle, UncontrolledDropdown, Spinner } from 'reactstrap'
import { dismissNotification, dismissAllNotifications, markAllNotificationsRead, markNotificationRead } from '@store/notifications'

// The API handles permission filtering; this component renders the returned items.
const TYPE_META = {
  contact: { icon: <Mail size={14} />, color: 'primary' },
  job_application: { icon: <Send size={14} />, color: 'info' },
  todo_overdue: { icon: <CheckSquare size={14} />, color: 'danger' },
  mention: { icon: <AtSign size={14} />, color: 'warning' }
}

// Add local midnight when the API returns a date without a time.
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
  const [markingAll, setMarkingAll] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)
  const [dismissingKey, setDismissingKey] = useState(null)

  const handleDismiss = (e, item) => {
    // Dismissing should not follow the surrounding link.
    e.preventDefault()
    e.stopPropagation()
    const key = `${item.type}-${item.id}`
    setDismissingKey(key)
    dispatch(dismissNotification({ type: item.type, id: item.id })).finally(() => setDismissingKey(null))
  }

  const handleMarkAllRead = () => {
    setMarkingAll(true)
    dispatch(markAllNotificationsRead()).finally(() => setMarkingAll(false))
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
              <Button color='link' size='sm' className='p-0 me-1' disabled={markingAll} onClick={handleMarkAllRead}>
                {markingAll ? <Spinner size='sm' /> : 'Mark all as read'}
              </Button>
            )}
            {items.length > 0 && (
              <Button color='link' size='sm' className='p-0' disabled={clearingAll} onClick={handleClearAll}>
                {clearingAll ? <Spinner size='sm' /> : 'Clear all'}
              </Button>
            )}
          </DropdownItem>
        </li>
        {items.length === 0 ? (
          <li className='p-2 text-center text-muted'>You're all caught up.</li>
        ) : (
          <PerfectScrollbar
            component='li'
            className='media-list scrollable-container'
            options={{ wheelPropagation: false, suppressScrollX: true }}
          >
            {items.map(item => {
              const meta = TYPE_META[item.type]
              const key = `${item.type}-${item.id}`
              // Marking a mention read keeps it visible until it is dismissed.
              const handleOpen = () => {
                if (item.type === 'mention' && !item.is_read) {
                  dispatch(markNotificationRead({ type: item.type, id: item.id }))
                }
              }
              return (
                <Link key={key} className='d-flex' to={meta ? item.path : '/'} onClick={handleOpen}>
                  <div className={classnames('list-item d-flex align-items-start', { 'opacity-50': item.is_read })}>
                    <div className='me-1'>
                      <Avatar icon={meta?.icon} color={meta?.color || 'secondary'} />
                    </div>
                    <div className='list-item-body flex-grow-1' style={{ minWidth: 0 }}>
                      <p className='media-heading d-flex align-items-center'>
                        <span
                          className={classnames('text-truncate me-auto', item.is_read ? 'fw-normal' : 'fw-bolder')}
                          style={{ minWidth: 0 }}
                        >
                          {item.title}
                        </span>
                        <small className='text-muted text-nowrap ms-50'>{relativeTime(item.date)}</small>
                      </p>
                      <small className='notification-text d-block mb-0'>{item.subtitle}</small>
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
