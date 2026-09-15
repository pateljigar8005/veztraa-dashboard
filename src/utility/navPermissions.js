// ** Menu items that every logged-in user can see regardless of role permissions
const ALWAYS_VISIBLE_IDS = ['dashboards']

const canViewId = (id, permissions) => ALWAYS_VISIBLE_IDS.includes(id) || !!permissions[id]?.view

// ** Filters a nav config (vertical: flat list with `header` dividers, or
// horizontal: top-level items with `children`) down to what the given
// user's role is permitted to view. Admins bypass filtering entirely.
export const filterNavByPermissions = (navItems, userData) => {
  const isAdmin = (userData?.role || '').toLowerCase() === 'admin'
  if (isAdmin || !userData) return navItems

  const permissions = userData.permissions || {}
  const filtered = []
  let pendingHeader = null

  for (const item of navItems) {
    if (item.header) {
      pendingHeader = item
      continue
    }

    if (item.children) {
      const visibleChildren = item.children.filter(child => canViewId(child.id, permissions))
      if (visibleChildren.length > 0) {
        filtered.push({ ...item, children: visibleChildren })
      }
      continue
    }

    if (canViewId(item.id, permissions)) {
      if (pendingHeader) {
        filtered.push(pendingHeader)
        pendingHeader = null
      }
      filtered.push(item)
    }
  }

  return filtered
}

// ** Maps a pathname to the menu permission id that governs it (mirrors the
// ids used in navigation/*/apps.js and roles-permissions/roles/menuPermissions.js)
const routeToMenuId = [
  { pattern: /^\/email/, id: 'email' },
  { pattern: /^\/chat/, id: 'chat' },
  { pattern: /^\/todo/, id: 'todo' },
  { pattern: /^\/calendar/, id: 'calendar' },
  { pattern: /^\/kanban/, id: 'kanban' },
  { pattern: /^\/project/, id: 'projects' },
  { pattern: /^\/client/, id: 'clients' },
  { pattern: /^\/quotation/, id: 'quotations' },
  { pattern: /^\/contract/, id: 'contracts' },
  { pattern: /^\/invoice/, id: 'invoiceApp' },
  { pattern: /^\/company/, id: 'company' },
  { pattern: /^\/user/, id: 'users' },
  { pattern: /^\/roles/, id: 'roles-permissions' },
  { pattern: /^\/service-item/, id: 'serviceItems' },
  { pattern: /^\/payment-method/, id: 'paymentMethods' },
  { pattern: /^\/terms-template/, id: 'termsTemplates' },
  { pattern: /^\/pdf-designer/, id: 'pdfDesignerTemplates' },
  { pattern: /^\/currency/, id: 'currencies' },
  { pattern: /^\/industry/, id: 'industries' },
  { pattern: /^\/team-member/, id: 'teamMembers' },
  { pattern: /^\/portfolio/, id: 'portfolioItems' },
  { pattern: /^\/case-study/, id: 'caseStudies' },
  { pattern: /^\/job-listing/, id: 'jobListings' }
]

// ** Whether the given pathname is permitted for this user (admins and
// always-visible routes like /dashboard always pass)
export const canAccessRoute = (pathname, userData) => {
  const isAdmin = (userData?.role || '').toLowerCase() === 'admin'
  if (isAdmin || !userData) return true

  const match = routeToMenuId.find(r => r.pattern.test(pathname))
  if (!match) return true // routes with no menu mapping (e.g. /dashboard) are always allowed

  const permissions = userData.permissions || {}
  return canViewId(match.id, permissions)
}

// ** Whether this user can perform a specific action (add/edit/delete/export)
// in the module that owns the given pathname. Granting "view" only covers
// seeing the module (menu visibility, opening the list/add/edit pages) - it
// does not imply any of the other actions, so this is checked separately
// wherever an Add/Edit/Delete/Export control is rendered or its route
// guarded. Admins bypass this entirely, same as view.
export const hasActionPermission = (pathname, action, userData) => {
  const isAdmin = (userData?.role || '').toLowerCase() === 'admin'
  if (isAdmin || !userData) return true

  const match = routeToMenuId.find(r => r.pattern.test(pathname))
  if (!match) return true // routes with no menu mapping (e.g. /dashboard) are always allowed

  return !!userData.permissions?.[match.id]?.[action]
}

// ** Convenience wrapper for call sites that don't already have userData on
// hand - e.g. a list's columns.js, which exports plain column definitions
// (not a component), so it can't read the logged-in user via a hook.
export const currentUserCan = (pathname, action) => {
  let userData = null
  try {
    userData = JSON.parse(localStorage.getItem('userData'))
  } catch (e) {
    userData = null
  }
  return hasActionPermission(pathname, action, userData)
}

// ** Infers which action a given add/edit route requires: '/x/add' -> 'add',
// '/x/edit/:id' -> 'edit', anything else -> null (no specific action implied,
// e.g. the list route itself - that's covered by canAccessRoute's 'view').
export const inferRouteAction = pathname => {
  if (/\/add$/.test(pathname)) return 'add'
  if (/\/edit\/[^/]+$/.test(pathname)) return 'edit'
  return null
}
