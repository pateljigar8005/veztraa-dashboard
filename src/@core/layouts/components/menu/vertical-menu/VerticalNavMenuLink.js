import { NavLink } from 'react-router-dom'
import classnames from 'classnames'
import { useSelector } from 'react-redux'
import { Badge } from 'reactstrap'

const VerticalNavMenuLink = ({ item, activeItem }) => {
  const LinkTag = item.externalLink ? 'a' : NavLink
  const emailUnread = useSelector(state => (item.id === 'email' ? state.email.unreadCount : 0))

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
                if (emailUnread > 0) {
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

        {emailUnread > 0 ? (
          <Badge className='menu-unread-badge ms-auto me-1' color='danger' pill>
            {emailUnread > 99 ? '99+' : emailUnread}
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