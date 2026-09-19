import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useStore } from 'react-redux'
import { Menu, CornerDownLeft, RefreshCw, PlusCircle, Search, Save, Download } from 'react-feather'
import { NavItem, NavLink, UncontrolledTooltip } from 'reactstrap'
import { hasActionPermission, inferRouteAction } from '@src/utility/navPermissions'
import { refetchForRoute } from '@src/utility/refreshRegistry'

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
  /^\/(user|client|payment-method|service-item|project|quotation|contract|invoice|terms-template|email-template|holiday|roles|pdf-designer|currency|industry|team-member|portfolio|case-study|job-listing|timesheet-activity|timesheet)\/(add|edit\/[^/]+)$/

const isPdfDesignerFormRoute = pathname => /^\/pdf-designer\/(add|edit\/[^/]+)$/.test(pathname)

const isCompanySettingsRoute = pathname => pathname === '/company'

const isAccountSettingsRoute = pathname => pathname === '/account-settings'

const isEmailRoute = pathname => /^\/email(\/[^/]+)?$/.test(pathname)

const downloadButtonIdByRoute = [
  { pattern: /^\/invoice\/view\/[^/]+$/, buttonId: 'invoice-download-pdf-btn' },
  { pattern: /^\/contract\/view\/[^/]+$/, buttonId: 'contract-download-pdf-btn' },
  { pattern: /^\/quotation\/view\/[^/]+$/, buttonId: 'quotation-download-pdf-btn' }
]
const findDownloadButtonId = pathname => downloadButtonIdByRoute.find(i => i.pattern.test(pathname))?.buttonId || null

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
  const isListRoute = Boolean(listToAddRoute[location.pathname])
  const addEnabled = Boolean(addRoute) && hasActionPermission(location.pathname, 'add', userData)

  const isSearchRoute = isListRoute || isEmailRoute(location.pathname)
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
            style={{ opacity: isSearchRoute ? 1 : 0.35, pointerEvents: isSearchRoute ? 'auto' : 'none' }}
            onClick={handleSearch}
          >
            <Search className='ficon' />
          </NavLink>
          <UncontrolledTooltip placement='bottom' target='navbar-search-btn'>
            {isSearchRoute ? 'Advanced Search' : 'Search (open a list page first)'}
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