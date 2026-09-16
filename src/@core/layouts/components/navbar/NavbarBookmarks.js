// ** React Imports
import { useLocation, useNavigate } from 'react-router-dom'

// ** Third Party Components
import { Menu, CornerDownLeft, RefreshCw, PlusCircle, Search, Save, Download } from 'react-feather'

// ** Reactstrap Imports
import { NavItem, NavLink, UncontrolledTooltip } from 'reactstrap'

// ** Utils
import { hasActionPermission, inferRouteAction } from '@src/utility/navPermissions'

// ** List pages that have a matching "/add" route
const listToAddRoute = {
  '/user': '/user/add',
  '/client': '/client/add',
  '/payment-method': '/payment-method/add',
  '/service-item': '/service-item/add',
  '/project': '/project/add',
  '/quotation': '/quotation/add',
  '/contract': '/contract/add',
  '/invoice': '/invoice/add',
  '/terms-template': '/terms-template/add',
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

// ** Matches any module's "/add" or "/edit/:id" form route
const addOrEditRoutePattern =
  /^\/(user|client|payment-method|service-item|project|quotation|contract|invoice|terms-template|roles|pdf-designer|currency|industry|team-member|portfolio|case-study|job-listing|timesheet-activity|timesheet)\/(add|edit\/[^/]+)$/

// ** The PDF Designer page has no <form> - only the widget's own toolbar Save
// button can hand back the current design (see its form/index.js). So on that
// page, forward the click into that button instead of calling form.requestSubmit().
const isPdfDesignerFormRoute = pathname => /^\/pdf-designer\/(add|edit\/[^/]+)$/.test(pathname)

// ** Company Settings is a single-record "edit" page that isn't part of the
// add/edit list pattern above (there's no /company/add or /company/edit/:id -
// just /company; its sidebar tabs are managed via a ?tab= query param so the
// pathname never changes), but it's still a <form> the navbar Save icon
// should submit.
const isCompanySettingsRoute = pathname => pathname === '/company'

// ** The Email app fetches its data over live IMAP calls (see the webmail
// feature) rather than a fast local DB query, so a full browser reload is a
// needlessly heavy way to "refresh" it - forward the click into the page's
// own hidden trigger instead, which just re-dispatches the same Redux thunks
// the page uses on mount.
const isEmailRoute = pathname => /^\/email(\/[^/]+)?$/.test(pathname)

// ** The Invoice, Contract and Quotation Details pages each offer a PDF
// download - they render it themselves (via @veztraa/report-renderer) and
// expose a hidden button whose id this table maps to, for the navbar icon
// to forward its click into.
const downloadButtonIdByRoute = [
  { pattern: /^\/invoice\/view\/[^/]+$/, buttonId: 'invoice-download-pdf-btn' },
  { pattern: /^\/contract\/view\/[^/]+$/, buttonId: 'contract-download-pdf-btn' },
  { pattern: /^\/quotation\/view\/[^/]+$/, buttonId: 'quotation-download-pdf-btn' }
]
const findDownloadButtonId = pathname => downloadButtonIdByRoute.find(i => i.pattern.test(pathname))?.buttonId || null

const NavbarBookmarks = props => {
  // ** Props
  const { setMenuVisibility } = props

  // ** Hooks
  const location = useLocation()
  const navigate = useNavigate()

  let userData = null
  try {
    userData = JSON.parse(localStorage.getItem('userData'))
  } catch (e) {
    userData = null
  }

  const addRoute = listToAddRoute[location.pathname]
  const isListRoute = Boolean(listToAddRoute[location.pathname])
  const addEnabled = Boolean(addRoute) && hasActionPermission(location.pathname, 'add', userData)

  // ** A list page that supports advanced search renders a hidden button
  // with this id (see AdvancedSearchModal usage in each module's Table.js);
  // pages that don't (e.g. Roles, which has no server-side search) simply
  // don't render one, so the click silently no-ops.
  const handleSearch = () => {
    if (!isListRoute) return
    document.getElementById('navbar-advanced-search-trigger')?.click()
  }

  const saveRouteAction = inferRouteAction(location.pathname)
  const isSaveRoute = addOrEditRoutePattern.test(location.pathname) || isCompanySettingsRoute(location.pathname)
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
    window.location.reload()
  }

  const downloadButtonId = findDownloadButtonId(location.pathname)
  const downloadEnabled = Boolean(downloadButtonId)
  const handleDownload = () => {
    if (!downloadButtonId) return
    document.getElementById(downloadButtonId)?.click()
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
            onClick={() => addEnabled && navigate(addRoute)}
          >
            <PlusCircle className='ficon' />
          </NavLink>
          <UncontrolledTooltip placement='bottom' target='navbar-add-btn'>
            {addEnabled
              ? 'Add'
              : listToAddRoute[location.pathname]
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
            style={{ opacity: isListRoute ? 1 : 0.35, pointerEvents: isListRoute ? 'auto' : 'none' }}
            onClick={handleSearch}
          >
            <Search className='ficon' />
          </NavLink>
          <UncontrolledTooltip placement='bottom' target='navbar-search-btn'>
            {isListRoute ? 'Advanced Search' : 'Search (open a list page first)'}
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
            {downloadEnabled ? 'Download PDF' : 'Download PDF (open an invoice, contract or quotation first)'}
          </UncontrolledTooltip>
        </NavItem>
      </ul>
    </>
  )
}

export default NavbarBookmarks
