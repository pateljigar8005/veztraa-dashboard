import navigationApps from './vertical/apps'

// Menu items that repeat under the same id (e.g. "My Leave" / "Leave
// Approvals" / "Leave Types" all map to the single 'leave' permission) get a
// shared, human-friendly title here instead of using whichever nav label
// happened to come first.
const PERMISSION_TITLE_OVERRIDES = {
  leave: 'Leave'
}

// Builds the roles & permissions grid straight from the real sidebar nav
// config, so a module removed from (or added to) the menu can't drift out of
// sync with the permissions screen again.
const buildMenuPermissionGroups = navItems => {
  const groups = []
  let currentGroup = null
  const seenIds = new Set()

  navItems.forEach(item => {
    if (item.header) {
      currentGroup = { section: item.header, items: [] }
      groups.push(currentGroup)
      return
    }

    if (!item.id || !currentGroup || seenIds.has(item.id)) return

    seenIds.add(item.id)
    currentGroup.items.push({
      id: item.id,
      title: PERMISSION_TITLE_OVERRIDES[item.id] || item.title
    })
  })

  return groups.filter(group => group.items.length > 0)
}

export const menuPermissionGroups = buildMenuPermissionGroups(navigationApps)

export const allMenuPermissionIds = menuPermissionGroups.flatMap(group => group.items.map(item => item.id))
