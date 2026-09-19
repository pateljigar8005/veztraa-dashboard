import { useContext } from 'react'
import { AbilityContext } from '@src/utility/context/Can'

export const resolveVerticalNavMenuItemComponent = item => {
  if (item.header) return 'VerticalNavMenuSectionHeader'
  if (item.children) return 'VerticalNavMenuGroup'
  return 'VerticalNavMenuLink'
}

export const resolveHorizontalNavMenuItemComponent = item => {
  if (item.children) return 'HorizontalNavMenuGroup'
  return 'HorizontalNavMenuLink'
}

export const isNavLinkActive = (link, currentURL, routerProps) => {
  return (
    currentURL === link ||
    (routerProps && routerProps.meta && routerProps.meta.navLink && routerProps.meta.navLink === link)
  )
}

export const hasActiveChild = (item, currentUrl) => {
  const { children } = item

  if (!children) {
    return false
  }

  for (const child of children) {
    if (child.children) {
      if (hasActiveChild(child, currentUrl)) {
        return true
      }
    }

    if (child && child.navLink && currentUrl && (child.navLink === currentUrl || currentUrl.includes(child.navLink))) {
      return true
    }
  }

  return false
}

export const removeChildren = (children, openGroup, currentActiveGroup) => {
  children.forEach(child => {
    if (!currentActiveGroup.includes(child.id)) {
      const index = openGroup.indexOf(child.id)
      if (index > -1) openGroup.splice(index, 1)
      if (child.children) removeChildren(child.children, openGroup, currentActiveGroup)
    }
  })
}

const checkForVisibleChild = (arr, ability) => {
  return arr.some(i => {
    if (i.children) {
      return checkForVisibleChild(i.children, ability)
    } else {
      return ability.can(i.action, i.resource)
    }
  })
}

export const canViewMenuGroup = item => {
  const ability = useContext(AbilityContext)
  const hasAnyVisibleChild = item.children && checkForVisibleChild(item.children, ability)

  if (!(item.action && item.resource)) {
    return hasAnyVisibleChild
  }
  return ability.can(item.action, item.resource) && hasAnyVisibleChild
}

export const canViewMenuItem = item => {
  const ability = useContext(AbilityContext)
  return ability.can(item.action, item.resource)
}