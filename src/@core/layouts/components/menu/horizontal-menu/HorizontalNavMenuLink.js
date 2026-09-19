import { NavLink } from 'react-router-dom'
import classnames from 'classnames'

const HorizontalNavMenuLink = ({ item, isChild, setMenuOpen }) => {
  const LinkTag = item.externalLink ? 'a' : NavLink

  const handleClick = () => {
    if (setMenuOpen) {
      setMenuOpen(false)
    }
  }

  return (
    <li
      onClick={handleClick}
      className={classnames('nav-item', {
        disabled: item.disabled
      })}
    >
      <LinkTag
        className={classnames('d-flex align-items-center', {
          'dropdown-item': isChild,
          'nav-link': !isChild
        })}
        target={item.newTab ? '_blank' : undefined}
        {...(item.externalLink === true
          ? {
              href: item.navLink || '/'
            }
          : {
              to: item.navLink || '/',
              className: ({ isActive }) => {
                const commonClass = 'd-flex align-items-center'
                if (isActive && !item.disabled && item.navLink !== '#') {
                  if (isChild) {
                    return `${commonClass} dropdown-item active`
                  } else {
                    return `${commonClass} nav-link active`
                  }
                } else {
                  if (isChild) {
                    return `${commonClass} dropdown-item`
                  } else {
                    return `${commonClass} nav-link`
                  }
                }
              }
            })}
      >
        {item.icon}
        <span>{item.title}</span>
      </LinkTag>
    </li>
  )
}

export default HorizontalNavMenuLink