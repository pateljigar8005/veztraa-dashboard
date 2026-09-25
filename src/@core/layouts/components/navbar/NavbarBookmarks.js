import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Menu, CornerDownLeft, RefreshCw, PlusCircle, Search, Save, Download, Send, Clock, Trash2 } from 'react-feather'
import { Badge, NavItem, NavLink, UncontrolledTooltip } from 'reactstrap'
import { hasActionPermission, inferRouteAction } from '@src/utility/navPermissions'
import { refetchForRoute } from '@src/utility/refreshRegistry'

const listToAddRoute = {
  '/user': '/user/add',
  '/client': '/client/add',
  '/payment-method': '/payment-method/add',
  '/event-category': '/event-category/add',
  '/service-item': '/service-item/add',
  '/project': '/project/add',
  '/quotation': '/quotation/add',
  '/contract': '/contract/add',
  '/invoice': '/invoice/add',
  '/terms-template': '/terms-template/add',
  '/email-template': '/email-template/add',
  '/holiday': '/holiday/add',
  '/pdf-designer': '/pdf-designer/add',
  '/currency': '/currency/add',
  '/industry': '/industry/add',
  '/roles': '/roles/add',
  '/team-member': '/team-member/add',
  '/portfolio': '/portfolio/add',
  '/case-study': '/case-study/add',
  '/job-listing': '/job-listing/add',
  '/timesheet': '/timesheet/add',
  '/timesheet-activity': '/timesheet-activity/add'
}

const addOrEditRoutePattern =
  /^\/(user|client|payment-method|event-category|service-item|project|quotation|contract|invoice|terms-template|email-template|holiday|roles|pdf-designer|currency|industry|team-member|portfolio|case-study|job-listing|timesheet-activity|timesheet)\/(add|edit\/[^/]+)$/

const isPdfDesignerFormRoute = pathname => /^\/pdf-designer\/(add|edit\/[^/]+)$/.test(pathname)

const isCompanySettingsRoute = pathname => pathname === '/company'

const isAccountSettingsRoute = pathname => pathname === '/account-settings'

const isEmailRoute = pathname => /^\/email(\/[^/]+)?$/.test(pathname)

// Todo's sub-routes (/todo/important, /todo/priority/high, ...) aren't in
// listToAddRoute the way other list pages are - Todo's own "Add Task" is
// already a visible button in its sidebar, not something this navbar
// needs to drive - but it does wire up the same Advanced Search modal
// (Tasks.js), so the Search icon still needs to recognize the route.
const isTodoRoute = pathname => /^\/todo(\/.*)?$/.test(pathname)

// List pages whose "add" is a modal on the page itself rather than an
// /add route - the Add icon clicks this hidden button instead of
// navigating. Kept out of listToAddRoute on purpose, since that map also
// decides isListRoute for the other icons.
const listToAddButtonId = {
  '/api-key': 'api-key-create-btn'
}

// listToAddRoute (below) covers every list page, but not every one of
// those actually wires up the Advanced Search modal (AdvancedSearchModal +
// the hidden #navbar-advanced-search-trigger button its list/ renders) -
// these four don't, so without this the Search icon looks enabled there
// but silently does nothing when clicked.
const noSearchRoutes = ['/email-template', '/terms-template', '/roles']

// `label` is the icon's tooltip on that route - it's a PDF on a document
// view page but an .xlsx export on the Activity Log list / Timesheet Report.
const downloadButtonIdByRoute = [
  { pattern: /^\/invoice\/view\/[^/]+$/, buttonId: 'invoice-download-pdf-btn', label: 'Download PDF' },
  { pattern: /^\/contract\/view\/[^/]+$/, buttonId: 'contract-download-pdf-btn', label: 'Download PDF' },
  { pattern: /^\/quotation\/view\/[^/]+$/, buttonId: 'quotation-download-pdf-btn', label: 'Download PDF' },
  { pattern: /^\/activity-log\/?$/, buttonId: 'activity-log-export-btn', label: 'Export to Excel' },
  { pattern: /^\/reports\/timesheet\/?$/, buttonId: 'timesheet-report-export-btn', label: 'Export to Excel' }
]
const findDownloadRoute = pathname => downloadButtonIdByRoute.find(i => i.pattern.test(pathname)) || null

// Same three routes as the download button above - each has its own
// "Send Email" button/handler already (see <module>/view/index.js's
// handleSendEmail), gated behind that module's own 'edit' permission, same
// as the button itself is.
const sendEmailButtonIdByRoute = [
  { pattern: /^\/invoice\/view\/[^/]+$/, buttonId: 'invoice-send-email-btn', resource: '/invoice' },
  { pattern: /^\/contract\/view\/[^/]+$/, buttonId: 'contract-send-email-btn', resource: '/contract' },
  { pattern: /^\/quotation\/view\/[^/]+$/, buttonId: 'quotation-send-email-btn', resource: '/quotation' }
]
const findSendEmailRoute = pathname => sendEmailButtonIdByRoute.find(i => i.pattern.test(pathname)) || null

// Every module with real ActivityLogger::log() calls on its controller
// (see the matching ActivityLogger import in each one - Client, Company
// Settings, Contract, Currency, Invoice, Payment Method, Project,
// Quotation, Role, Service Item, Terms Template, Timesheet, User) renders
// a hidden
// <HistoryModal buttonId='<module>-history-btn' /> (see
// src/views/apps/activity-log/HistoryModal.js) instead of a visible button
// on the page itself, so every record's History action comes from this one
// navbar icon. Gated by the 'activityLogs' permission entry
// (ActivityLogController is hard admin-only server-side), not each
// module's own resource - History is about who-did-what across the app,
// not a capability of any one module. Company Settings has no :id in its
// URL (a singleton record, see ActivityLog::forEntity()'s entityId=0
// sentinel) so it matches on the bare route instead of an /edit/:id one;
// User's form doubles as /account-settings (self-service), which gets the
// same button id since it's the same UserForm component.
const historyButtonIdByRoute = [
  { pattern: /^\/invoice\/view\/[^/]+$/, buttonId: 'invoice-history-btn' },
  { pattern: /^\/contract\/view\/[^/]+$/, buttonId: 'contract-history-btn' },
  { pattern: /^\/quotation\/view\/[^/]+$/, buttonId: 'quotation-history-btn' },
  { pattern: /^\/client\/edit\/[^/]+$/, buttonId: 'client-history-btn' },
  { pattern: /^\/client\/view\/[^/]+$/, buttonId: 'client-view-history-btn' },
  { pattern: /^\/currency\/edit\/[^/]+$/, buttonId: 'currency-history-btn' },
  { pattern: /^\/payment-method\/edit\/[^/]+$/, buttonId: 'payment-method-history-btn' },
  { pattern: /^\/project\/edit\/[^/]+$/, buttonId: 'project-history-btn' },
  { pattern: /^\/roles\/edit\/[^/]+$/, buttonId: 'role-history-btn' },
  { pattern: /^\/service-item\/edit\/[^/]+$/, buttonId: 'service-item-history-btn' },
  { pattern: /^\/terms-template\/edit\/[^/]+$/, buttonId: 'terms-template-history-btn' },
  { pattern: /^\/user\/edit\/[^/]+$/, buttonId: 'user-history-btn' },
  { pattern: /^\/account-settings$/, buttonId: 'user-history-btn' },
  { pattern: /^\/timesheet\/edit\/[^/]+$/, buttonId: 'timesheet-history-btn' },
  { pattern: /^\/company$/, buttonId: 'company-history-btn' },
  { pattern: /^\/event-category\/edit\/[^/]+$/, buttonId: 'event-category-history-btn' },
  { pattern: /^\/industry\/edit\/[^/]+$/, buttonId: 'industry-history-btn' },
  { pattern: /^\/timesheet-activity\/edit\/[^/]+$/, buttonId: 'timesheet-activity-history-btn' },
  { pattern: /^\/email-template\/edit\/[^/]+$/, buttonId: 'email-template-history-btn' },
  { pattern: /^\/holiday\/edit\/[^/]+$/, buttonId: 'holiday-history-btn' },
  { pattern: /^\/team-member\/edit\/[^/]+$/, buttonId: 'team-member-history-btn' },
  { pattern: /^\/portfolio\/edit\/[^/]+$/, buttonId: 'portfolio-history-btn' },
  { pattern: /^\/case-study\/edit\/[^/]+$/, buttonId: 'case-study-history-btn' },
  { pattern: /^\/job-listing\/edit\/[^/]+$/, buttonId: 'job-listing-history-btn' },
  { pattern: /^\/contact-submission\/view\/[^/]+$/, buttonId: 'contact-submission-history-btn' },
  { pattern: /^\/job-application\/view\/[^/]+$/, buttonId: 'job-application-history-btn' }
]
const findHistoryRoute = pathname => historyButtonIdByRoute.find(i => i.pattern.test(pathname)) || null

const NavbarBookmarks = props => {
  const { setMenuVisibility } = props

  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useStore()

  let userData = null
  try {
    userData = JSON.parse(localStorage.getItem('userData'))
  } catch (e) {
    userData = null
  }

  const addRoute = listToAddRoute[location.pathname]
  const addButtonId = listToAddButtonId[location.pathname]
  const isListRoute = Boolean(listToAddRoute[location.pathname])
  const addEnabled = Boolean(addRoute || addButtonId) && hasActionPermission(location.pathname, 'add', userData)
  const handleAdd = () => {
    if (!addEnabled) return
    if (addButtonId) {
      document.getElementById(addButtonId)?.click()
      return
    }
    navigate(addRoute)
  }

  const isSearchRoute =
    (isListRoute && !noSearchRoutes.includes(location.pathname)) ||
    isEmailRoute(location.pathname) ||
    isTodoRoute(location.pathname)
  const handleSearch = () => {
    if (!isSearchRoute) return
    document.getElementById('navbar-advanced-search-trigger')?.click()
  }

  const saveRouteAction = inferRouteAction(location.pathname)
  const isSaveRoute =
    addOrEditRoutePattern.test(location.pathname) ||
    isCompanySettingsRoute(location.pathname) ||
    isAccountSettingsRoute(location.pathname)
  const saveEnabled = isSaveRoute && (!saveRouteAction || hasActionPermission(location.pathname, saveRouteAction, userData))
  const handleSave = () => {
    if (!saveEnabled) return

    if (isPdfDesignerFormRoute(location.pathname)) {
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Save')
      saveBtn?.click()
      return
    }

    const form = document.querySelector('form')
    if (form) form.requestSubmit()
  }

  const handleRefresh = () => {
    if (isEmailRoute(location.pathname)) {
      document.getElementById('email-refresh-trigger')?.click()
      return
    }
    if (refetchForRoute(location.pathname, dispatch, store.getState)) {
      return
    }
    window.location.reload()
  }

  const downloadRoute = findDownloadRoute(location.pathname)
  const downloadButtonId = downloadRoute?.buttonId || null
  const downloadEnabled = Boolean(downloadButtonId)
  const handleDownload = () => {
    if (!downloadButtonId) return
    document.getElementById(downloadButtonId)?.click()
  }

  const sendEmailRoute = findSendEmailRoute(location.pathname)
  const sendEmailRouteMatches = Boolean(sendEmailRoute)
  const sendEmailEnabled = sendEmailRouteMatches && hasActionPermission(sendEmailRoute.resource, 'edit', userData)
  const handleSendEmail = () => {
    if (!sendEmailEnabled) return
    document.getElementById(sendEmailRoute.buttonId)?.click()
  }

  // Every list page with a bulk-delete icon ticks rows into its own slice
  // (setSelectedIds/setSelectedUids) rather than local component state, so
  // this icon can read the count directly instead of a DOM lookup - the
  // delete itself (confirm + request) is still that list page's own hidden
  // button, same idea as Download/Send Email above. Both selectors are read
  // unconditionally (hooks can't be called conditionally); which one
  // actually applies is picked below based on the current route.
  const isActivityLogListRoute = /^\/activity-log\/?$/.test(location.pathname)
  const activityLogSelectedCount = useSelector(state => state.activityLogs.selectedIds.length)
  const emailSelectedCount = useSelector(state => state.email.selectedUids.length)
  const bulkDeleteRoute = isActivityLogListRoute
    ? { buttonId: 'activity-log-bulk-delete-btn', resource: '/activity-log', count: activityLogSelectedCount }
    : isEmailRoute(location.pathname)
      ? { buttonId: 'email-bulk-delete-btn', resource: '/email', count: emailSelectedCount }
      : null
  const bulkDeleteCount = bulkDeleteRoute?.count || 0
  const bulkDeleteVisible = Boolean(bulkDeleteRoute) && hasActionPermission(bulkDeleteRoute.resource, 'delete', userData)
  const bulkDeleteEnabled = bulkDeleteVisible && bulkDeleteCount > 0
  const handleBulkDelete = () => {
    if (!bulkDeleteEnabled) return
    document.getElementById(bulkDeleteRoute.buttonId)?.click()
  }

  const historyRoute = findHistoryRoute(location.pathname)
  const historyRouteMatches = Boolean(historyRoute)
  const historyEnabled = historyRouteMatches && hasActionPermission('/activity-log', 'view', userData)
  const handleHistory = () => {
    if (!historyEnabled) return
    document.getElementById(historyRoute.buttonId)?.click()
  }

  return (
    <>
      <ul className='navbar-nav d-xl-none'>
        <NavItem className='mobile-menu me-auto'>
          <NavLink className='nav-menu-main menu-toggle hidden-xs is-active' onClick={() => setMenuVisibility(true)}>
            <Menu className='ficon' />
          </NavLink>
        </NavItem>
      </ul>
      <ul className='nav navbar-nav align-items-center'>
        <NavItem className='d-none d-lg-block'>
          <NavLink
            className='nav-link-style'
            id='navbar-add-btn'
            style={{ opacity: addEnabled ? 1 : 0.35, pointerEvents: addEnabled ? 'auto' : 'none' }}
            onClick={handleAdd}
          >
            <PlusCircle className='ficon' />
          </NavLink>
          <UncontrolledTooltip placement='bottom' target='navbar-add-btn'>
            {addEnabled
              ? 'Add'
              : listToAddRoute[location.pathname] || addButtonId
                ? "Add (you don't have permission)"
                : 'Add (open a list page first)'}
          </UncontrolledTooltip>
        </NavItem>
        <NavItem className='d-none d-lg-block'>
          <NavLink className='nav-link-style' id='navbar-refresh-btn' onClick={handleRefresh}>
            <RefreshCw className='ficon' />
          </NavLink>
          <UncontrolledTooltip placement='bottom' target='navbar-refresh-btn'>
            Refresh
          </UncontrolledTooltip>
        </NavItem>
        <NavItem className='d-none d-lg-block'>
          <NavLink
            className='nav-link-style'
            id='navbar-search-btn'
            style={{ opacity: isSearchRoute ? 1 : 0.35, pointerEvents: isSearchRoute ? 'auto' : 'none' }}
            onClick={handleSearch}
          >
            <Search className='ficon' />
          </NavLink>
          <UncontrolledTooltip placement='bottom' target='navbar-search-btn'>
            {isSearchRoute
              ? 'Advanced Search'
              : isListRoute
                ? 'Advanced Search (not available on this page)'
                : 'Search (open a list page first)'}
          </UncontrolledTooltip>
        </NavItem>
        <NavItem className='d-none d-lg-block'>
          <NavLink className='nav-link-style' id='navbar-back-btn' onClick={() => navigate(-1)}>
            <CornerDownLeft className='ficon' />
          </NavLink>
          <UncontrolledTooltip placement='bottom' target='navbar-back-btn'>
            Back
          </UncontrolledTooltip>
        </NavItem>
        <NavItem className='d-none d-lg-block'>
          <NavLink
            className='nav-link-style'
            id='navbar-save-btn'
            style={{ opacity: saveEnabled ? 1 : 0.35, pointerEvents: saveEnabled ? 'auto' : 'none' }}
            onClick={handleSave}
          >
            <Save className='ficon' />
          </NavLink>
          <UncontrolledTooltip placement='bottom' target='navbar-save-btn'>
            {saveEnabled
              ? 'Save'
              : isSaveRoute
                ? "Save (you don't have permission)"
                : 'Save (open an add/edit page first)'}
          </UncontrolledTooltip>
        </NavItem>
        <NavItem className='d-none d-lg-block'>
          <NavLink
            className='nav-link-style'
            id='navbar-download-btn'
            style={{ opacity: downloadEnabled ? 1 : 0.35, pointerEvents: downloadEnabled ? 'auto' : 'none' }}
            onClick={handleDownload}
          >
            <Download className='ficon' />
          </NavLink>
          <UncontrolledTooltip placement='bottom' target='navbar-download-btn'>
            {downloadEnabled ? downloadRoute.label : 'Download PDF (open an invoice, contract or quotation first)'}
          </UncontrolledTooltip>
        </NavItem>
        {sendEmailRouteMatches && (
          <NavItem className='d-none d-lg-block'>
            <NavLink
              className='nav-link-style'
              id='navbar-send-email-btn'
              style={{ opacity: sendEmailEnabled ? 1 : 0.35, pointerEvents: sendEmailEnabled ? 'auto' : 'none' }}
              onClick={handleSendEmail}
            >
              <Send className='ficon' />
            </NavLink>
            <UncontrolledTooltip placement='bottom' target='navbar-send-email-btn'>
              {sendEmailEnabled ? 'Send Email' : "Send Email (you don't have permission)"}
            </UncontrolledTooltip>
          </NavItem>
        )}
        {bulkDeleteVisible && (
          <NavItem className='d-none d-lg-block'>
            <NavLink
              className='nav-link-style position-relative'
              id='navbar-bulk-delete-btn'
              style={{ opacity: bulkDeleteEnabled ? 1 : 0.35, pointerEvents: bulkDeleteEnabled ? 'auto' : 'none' }}
              onClick={handleBulkDelete}
            >
              <Trash2 className='ficon' />
              {bulkDeleteEnabled && (
                <Badge pill color='danger' className='badge-up'>
                  {bulkDeleteCount}
                </Badge>
              )}
            </NavLink>
            <UncontrolledTooltip placement='bottom' target='navbar-bulk-delete-btn'>
              {bulkDeleteEnabled ? `Delete selected (${bulkDeleteCount})` : 'Delete selected (tick rows first)'}
            </UncontrolledTooltip>
          </NavItem>
        )}
        {historyRouteMatches && (
          <NavItem className='d-none d-lg-block'>
            <NavLink
              className='nav-link-style'
              id='navbar-history-btn'
              style={{ opacity: historyEnabled ? 1 : 0.35, pointerEvents: historyEnabled ? 'auto' : 'none' }}
              onClick={handleHistory}
            >
              <Clock className='ficon' />
            </NavLink>
            <UncontrolledTooltip placement='bottom' target='navbar-history-btn'>
              {historyEnabled ? 'History' : "History (you don't have permission)"}
            </UncontrolledTooltip>
          </NavItem>
        )}
      </ul>
    </>
  )
}

export default NavbarBookmarks