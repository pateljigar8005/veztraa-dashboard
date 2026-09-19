import { NavLink } from 'react-router-dom'
import classnames from 'classnames'
import { Badge } from 'reactstrap'

const VerticalNavMenuLink = ({ item, activeItem }) => {
  const LinkTag = item.externalLink ? 'a' : NavLink

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