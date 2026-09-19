import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import classnames from 'classnames'
import { Collapse, Badge } from 'reactstrap'
import VerticalNavMenuItems from './VerticalNavMenuItems'
import { hasActiveChild, removeChildren } from '@layouts/utils'

const VerticalNavMenuGroup = ({
  item,
  groupOpen,
  menuHover,
  activeItem,
  parentItem,
  groupActive,
  setGroupOpen,
  menuCollapsed,
  setGroupActive,
  currentActiveGroup,
  setCurrentActiveGroup,
  ...rest
}) => {
  const location = useLocation()

  const currentURL = useLocation().pathname

  const toggleOpenGroup = (item, parent) => {
    let openGroup = groupOpen
    const activeGroup = groupActive

    if (openGroup.includes(item.id)) {
      openGroup.splice(openGroup.indexOf(item.id), 1)

      if (item.children) {
        removeChildren(item.children, openGroup, groupActive)
      }
    } else if (activeGroup.includes(item.id) || currentActiveGroup.includes(item.id)) {

      if (!activeGroup.includes(item.id) && currentActiveGroup.includes(item.id)) {
        activeGroup.push(item.id)
      } else {
        activeGroup.splice(activeGroup.indexOf(item.id), 1)
      }

      setGroupActive([...activeGroup])
    } else if (parent) {
      if (parent.children) {
        removeChildren(parent.children, openGroup, groupActive)
      }

      if (!openGroup.includes(item.id)) {
        openGroup.push(item.id)
      }
    } else {

      openGroup = []

      if (!openGroup.includes(item.id)) {
        openGroup.push(item.id)
      }
    }
    setGroupOpen([...openGroup])
  }

  const onCollapseClick = (e, item) => {
    toggleOpenGroup(item, parentItem)

    e.preventDefault()
  }

  useEffect(() => {
    if (hasActiveChild(item, currentURL)) {
      if (!groupActive.includes(item.id)) groupActive.push(item.id)
    } else {
      const index = groupActive.indexOf(item.id)
      if (index > -1) groupActive.splice(index, 1)
    }
    setGroupActive([...groupActive])
    setCurrentActiveGroup([...groupActive])
    setGroupOpen([])
  }, [location])

  const openClassCondition = id => {
    if ((menuCollapsed && menuHover) || menuCollapsed === false) {
      if (groupActive.includes(id) || groupOpen.includes(id)) {
        return true
      }
    } else if (groupActive.includes(id) && menuCollapsed && menuHover === false) {
      return false
    } else {
      return null
    }
  }

  return (
    <li
      className={classnames('nav-item has-sub', {
        open: openClassCondition(item.id),
        'menu-collapsed-open': groupActive.includes(item.id),
        'sidebar-group-active':
          groupActive.includes(item.id) || groupOpen.includes(item.id) || currentActiveGroup.includes(item.id)
      })}
    >
      <Link className='d-flex align-items-center' to='/' onClick={e => onCollapseClick(e, item)}>
        {item.icon}
        <span className='menu-title text-truncate'>{item.title}</span>

        {item.badge && item.badgeText ? (
          <Badge className='ms-auto me-1' color={item.badge} pill>
            {item.badgeText}
          </Badge>
        ) : null}
      </Link>

      {                                                                     }
      <ul className='menu-content'>
        <Collapse isOpen={(groupActive && groupActive.includes(item.id)) || (groupOpen && groupOpen.includes(item.id))}>
          <VerticalNavMenuItems
            {...rest}
            items={item.children}
            groupActive={groupActive}
            setGroupActive={setGroupActive}
            currentActiveGroup={currentActiveGroup}
            setCurrentActiveGroup={setCurrentActiveGroup}
            groupOpen={groupOpen}
            setGroupOpen={setGroupOpen}
            parentItem={item}
            menuCollapsed={menuCollapsed}
            menuHover={menuHover}
            activeItem={activeItem}
          />
        </Collapse>
      </ul>
    </li>
  )
}

export default VerticalNavMenuGroup