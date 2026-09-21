import { NavLink } from 'react-router-dom'
import classnames from 'classnames'
import { useSelector } from 'react-redux'
import { Badge } from 'reactstrap'

// Same "small red pill on the nav item" treatment as Email's own unread
// count, extended to Contact Us/Job Applications - both read from the
// notification poll's per-type breakdown (see src/redux/notifications.js,
// NotificationController::index()'s `byType`) instead of a dedicated
// endpoint each, since that data is already being polled for the bell.
const UNREAD_SELECTORS = {
  email: state => state.email.unreadCount,
  contactSubmissions: state => state.notifications.byType.contact,
  jobApplications: state => state.notifications.byType.job_application
}

const VerticalNavMenuLink = ({ item, activeItem }) => {
  const LinkTag = item.externalLink ? 'a' : NavLink
  const unreadCount = useSelector(state => UNREAD_SELECTORS[item.id]?.(state) || 0)

  return (
    <li
      className={classnames({
        'nav-item': !item.children,
        disabled: item.disabled,
        active: item.navLink === activeItem
      })}
    >
      <LinkTag
        className='d-flex align-items-center'
        target={item.newTab ? '_blank' : undefined}
        {...(item.externalLink === true
          ? {
              href: item.navLink || '/'
            }
          : {
              to: item.navLink || '/',
              className: ({ isActive }) => {
                if (isActive && !item.disabled) {
                  return 'd-flex align-items-center active'
                }
                // An inactive link isn't a flex row by default, which the
                // right-aligned badge (ms-auto) needs.
                if (unreadCount > 0) {
                  return 'd-flex align-items-center'
                }
              }
            })}
        onClick={e => {
          if (item.navLink.length === 0 || item.navLink === '#' || item.disabled === true) {
            e.preventDefault()
          }
        }}
      >
        {item.icon}
        <span className='menu-item text-truncate'>{item.title}</span>

        {unreadCount > 0 ? (
          <Badge className='menu-unread-badge ms-auto me-1' color='danger' pill>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        ) : null}

        {item.badge && item.badgeText ? (
          <Badge className='ms-auto me-1' color={item.badge} pill>
            {item.badgeText}
          </Badge>
        ) : null}
      </LinkTag>
    </li>
  )
}

export default VerticalNavMenuLink