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
  '/roles': '/roles/add'
}

// ** Matches any module's "/add" or "/edit/:id" form route
const addOrEditRoutePattern =
  /^\/(user|client|payment-method|service-item|project|quotation|contract|invoice|terms-template|roles|pdf-designer|currency)\/(add|edit\/[^/]+)$/

// ** The PDF Designer page has no <form> - only the widget's own toolbar Save
// button can hand back the current design (see its form/index.js). So on that
// page, forward the click into that button instead of calling form.requestSubmit().
const isPdfDesignerFormRoute = pathname => /^\/pdf-designer\/(add|edit\/[^/]+)$/.test(pathname)

// ** Company Settings is a single-record "edit" page that isn't part of the
// add/edit list pattern above (there's no /company/add or /company/edit/:id -
// just /company), but it's still a <form> the navbar Save icon should submit.
const isCompanySettingsRoute = pathname => pathname === '/company'

// ** Only the Invoice Details page currently offers a PDF download - it does
// the actual rendering itself (via @veztraa/report-renderer) and exposes a
// button with this id for the navbar icon to forward the click into.
const isInvoiceViewRoute = pathname => /^\/invoice\/view\/[^/]+$/.test(pathname)

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
  const addEnabled = Boolean(addRoute) && hasActionPermission(location.pathname, 'add', userData)

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

  const downloadEnabled = isInvoiceViewRoute(location.pathname)
  const handleDownload = () => {
    if (!downloadEnabled) return
    document.getElementById('invoice-download-pdf-btn')?.click()
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
          <NavLink className='nav-link-style' id='navbar-refresh-btn' onClick={() => window.location.reload()}>
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
            style={{ opacity: addEnabled ? 1 : 0.35, pointerEvents: addEnabled ? 'auto' : 'none' }}
          >
            <Search className='ficon' />
          </NavLink>
          <UncontrolledTooltip placement='bottom' target='navbar-search-btn'>
            {addEnabled ? 'Search' : 'Search (open a list page first)'}
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
            {downloadEnabled ? 'Download PDF' : 'Download PDF (open an invoice first)'}
          </UncontrolledTooltip>
        </NavItem>
      </ul>
    </>
  )
}

export default NavbarBookmarks
