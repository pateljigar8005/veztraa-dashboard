import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import classnames from 'classnames'
import { usePopper } from 'react-popper'
import { hasActiveChild } from '@layouts/utils'
import { useRTL } from '@hooks/useRTL'
import HorizontalNavMenuItems from './HorizontalNavMenuItems'

const applyHeight = {
  enabled: true,
  name: 'applyHeight',
  phase: 'beforeWrite',
  fn: data => {
    const pageHeight = window.innerHeight,
      popperEl = data.state.elements.popper,
      ddTop = popperEl.getBoundingClientRect().top,
      ddHeight = popperEl.clientHeight
    let maxHeight, stylesObj
    if (pageHeight - ddTop - ddHeight - 28 < 1) {
      maxHeight = pageHeight - ddTop - 25
      stylesObj = {
        maxHeight,
        overflowY: 'auto'
      }
    }
    const ddRef = popperEl.getBoundingClientRect()
    if (ddRef.left + ddRef.width - (window.innerWidth - 16) >= 0) {
      popperEl.closest('.dropdown').classList.add('openLeft')
    }
    data.state.styles.popper = { ...data.state.styles.popper, ...stylesObj }
  }
}

const HorizontalNavMenuGroup = props => {
  const { item, submenu, isChild } = props

  const [menuOpen, setMenuOpen] = useState(false)
  const [popperElement, setPopperElement] = useState(null)
  const [referenceElement, setReferenceElement] = useState(null)

  const [isRtl] = useRTL()

  const popperOffsetHorizontal = isRtl ? 16 : -16
  const popperPlacement = isRtl ? 'bottom-end' : 'bottom-start'
  const popperPlacementSubMenu = isRtl ? 'left-start' : 'right-start'

  const currentURL = useLocation().pathname
  const { update, styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: isChild ? popperPlacementSubMenu : popperPlacement,
    modifiers: [
      applyHeight,
      {
        enabled: true,
        name: 'offset',
        options: {
          offset: isChild ? [-8, 15] : [popperOffsetHorizontal, 5]
        }
      }
    ]
  })

  const handleMouseEnter = () => {
    setMenuOpen(true)
    update()
  }

  return (
    <li
      ref={setReferenceElement}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setMenuOpen(false)}
      className={classnames('dropdown', {
        show: menuOpen,
        'nav-item': submenu === false,
        'dropdown-submenu': submenu === true,
        'sidebar-group-active active': hasActiveChild(item, currentURL)
      })}
    >
      <Link
        to='/'
        onClick={e => e.preventDefault()}
        className={classnames('dropdown-toggle d-flex align-items-center', {
          'dropdown-item': submenu === true,
          'nav-link': submenu === false
        })}
      >
        {item.icon}
        <span>{item.title}</span>
      </Link>
      <ul
        ref={setPopperElement}
        style={{ ...styles.popper }}
        {...attributes.popper}
        className={classnames('dropdown-menu', { 'first-level': submenu === false })}
      >
        <HorizontalNavMenuItems
          isChild={true}
          submenu={true}
          parentItem={item}
          menuOpen={menuOpen}
          items={item.children}
          setMenuOpen={setMenuOpen}
        />
      </ul>
    </li>
  )
}

export default HorizontalNavMenuGroup