import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Avatar from '@components/avatar'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Bell, Mail, Send, Trello, CheckSquare } from 'react-feather'
import { Badge, DropdownMenu, DropdownItem, DropdownToggle, UncontrolledDropdown } from 'reactstrap'

// Real data from GET /notifications (see src/redux/notifications.js,
// polled by useNotificationPolling.js) - the API already permission-gates
// and own-records-scopes everything in it, so this just renders whatever
// came back. No "mark as read"/"read all" action here - a submission's
// read state is real (toggled from its own page), but there's no honest
// equivalent for an overdue task, so every item just links to where it's
// actually handled instead.
const TYPE_META = {
  contact: { icon: <Mail size={14} />, color: 'primary' },
  job_application: { icon: <Send size={14} />, color: 'info' },
  kanban_overdue: { icon: <Trello size={14} />, color: 'danger' },
  todo_overdue: { icon: <CheckSquare size={14} />, color: 'danger' }
}

// item.date is either a full 'YYYY-MM-DD HH:MM:SS' (contact/job_application,
// from created_at) or a bare 'YYYY-MM-DD' (kanban_overdue/todo_overdue, from
// due_date) - a bare date string parses as UTC midnight in JS and can
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
  const { count, items } = useSelector(state => state.notifications)

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
          <DropdownItem className='d-flex' tag='div' header>
            <h4 className='notification-title mb-0 me-auto'>Notifications</h4>
            {count > 0 && (
              <Badge tag='div' color='light-primary' pill>
                {count} New
              </Badge>
            )}
          </DropdownItem>
        </li>
        {items.length === 0 ? (
          <li className='p-2 text-center text-muted'>You're all caught up.</li>
        ) : (
          <PerfectScrollbar component='li' className='media-list scrollable-container' options={{ wheelPropagation: false }}>
            {items.map(item => {
              const meta = TYPE_META[item.type]
              return (
                <Link key={`${item.type}-${item.id}`} className='d-flex' to={meta ? item.path : '/'}>
                  <div className='list-item d-flex align-items-start'>
                    <div className='me-1'>
                      <Avatar icon={meta?.icon} color={meta?.color || 'secondary'} />
                    </div>
                    <div className='list-item-body flex-grow-1'>
                      <p className='media-heading'>
                        <span className='fw-bolder'>{item.title}</span>
                      </p>
                      <small className='notification-text d-block text-truncate'>{item.subtitle}</small>
                      <small className='text-muted'>{relativeTime(item.date)}</small>
                    </div>
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
