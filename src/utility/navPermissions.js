const ALWAYS_VISIBLE_IDS = ['dashboards']

const canViewId = (id, permissions) => ALWAYS_VISIBLE_IDS.includes(id) || !!permissions[id]?.view

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
  { pattern: /^\/event-category/, id: 'eventCategories' },
  { pattern: /^\/terms-template/, id: 'termsTemplates' },
  { pattern: /^\/email-template/, id: 'emailTemplates' },
  { pattern: /^\/holiday/, id: 'holidays' },
  { pattern: /^\/reports\/invoice/, id: 'invoiceReports' },
  { pattern: /^\/reports\/timesheet/, id: 'timesheetReports' },
  { pattern: /^\/pdf-designer/, id: 'pdfDesignerTemplates' },
  { pattern: /^\/currency/, id: 'currencies' },
  { pattern: /^\/industry/, id: 'industries' },
  { pattern: /^\/team-member/, id: 'teamMembers' },
  { pattern: /^\/portfolio/, id: 'portfolioItems' },
  { pattern: /^\/case-study/, id: 'caseStudies' },
  { pattern: /^\/job-listing/, id: 'jobListings' },
  { pattern: /^\/timesheet-activity/, id: 'timesheetActivities' },
  { pattern: /^\/timesheet/, id: 'timesheets' },
  { pattern: /^\/contact-submission/, id: 'contactSubmissions' },
  { pattern: /^\/job-application/, id: 'jobApplications' },
  { pattern: /^\/api-key/, id: 'apiKeys' }
]

export const canAccessRoute = (pathname, userData) => {
  const isAdmin = (userData?.role || '').toLowerCase() === 'admin'
  if (isAdmin || !userData) return true

  const match = routeToMenuId.find(r => r.pattern.test(pathname))
  if (!match) return true

  const permissions = userData.permissions || {}
  return canViewId(match.id, permissions)
}

export const hasActionPermission = (pathname, action, userData) => {
  const isAdmin = (userData?.role || '').toLowerCase() === 'admin'
  if (isAdmin || !userData) return true

  const match = routeToMenuId.find(r => r.pattern.test(pathname))
  if (!match) return true

  return !!userData.permissions?.[match.id]?.[action]
}

export const currentUserCan = (pathname, action) => {
  let userData = null
  try {
    userData = JSON.parse(localStorage.getItem('userData'))
  } catch (e) {
    userData = null
  }
  return hasActionPermission(pathname, action, userData)
}

export const inferRouteAction = pathname => {
  if (/\/add$/.test(pathname)) return 'add'
  if (/\/edit\/[^/]+$/.test(pathname)) return 'edit'
  return null
}