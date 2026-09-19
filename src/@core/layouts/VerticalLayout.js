import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { handleMenuCollapsed, handleContentWidth, handleMenuHidden } from '@store/layout'
import classnames from 'classnames'
import { ArrowUp } from 'react-feather'
import { Navbar, Button } from 'reactstrap'
import themeConfig from '@configs/themeConfig'
import Customizer from '@components/customizer'
import ScrollToTop from '@components/scrolltop'
import NavbarComponent from './components/navbar'
import SidebarComponent from './components/menu/vertical-menu'
import { useRTL } from '@hooks/useRTL'
import { useSkin } from '@hooks/useSkin'
import { useLayout } from '@hooks/useLayout'
import { useNavbarType } from '@hooks/useNavbarType'
import { useFooterType } from '@hooks/useFooterType'
import { useNavbarColor } from '@hooks/useNavbarColor'
import '@styles/base/core/menu/menu-types/vertical-menu.scss'
import '@styles/base/core/menu/menu-types/vertical-overlay-menu.scss'

const VerticalLayout = props => {
  const { menu, navbar, children, menuData } = props

  const [isRtl, setIsRtl] = useRTL()
  const { skin, setSkin } = useSkin()
  const { navbarType, setNavbarType } = useNavbarType()
  const { footerType, setFooterType } = useFooterType()
  const { navbarColor, setNavbarColor } = useNavbarColor()
  const { layout, setLayout, setLastLayout } = useLayout()

  const [isMounted, setIsMounted] = useState(false)
  const [menuVisibility, setMenuVisibility] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  const dispatch = useDispatch()
  const layoutStore = useSelector(state => state.layout)

  const handleWindowWidth = () => {
    setWindowWidth(window.innerWidth)
  }

  const location = useLocation()
  const isHidden = layoutStore.menuHidden
  const contentWidth = layoutStore.contentWidth
  const menuCollapsed = layoutStore.menuCollapsed

  const setMenuCollapsed = val => dispatch(handleMenuCollapsed(val))

  const setContentWidth = val => dispatch(handleContentWidth(val))

  const setIsHidden = val => dispatch(handleMenuHidden(val))

  useEffect(() => {
    if (menuVisibility && windowWidth < 1200) {
      setMenuVisibility(false)
    }
  }, [location])

  useEffect(() => {
    if (window !== undefined) {
      window.addEventListener('resize', handleWindowWidth)
    }
  }, [windowWidth])

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const footerClasses = {
    static: 'footer-static',
    sticky: 'footer-fixed',
    hidden: 'footer-hidden'
  }

  const navbarWrapperClasses = {
    floating: 'navbar-floating',
    sticky: 'navbar-sticky',
    static: 'navbar-static',
    hidden: 'navbar-hidden'
  }

  const navbarClasses = {
    floating: contentWidth === 'boxed' ? 'floating-nav container-xxl' : 'floating-nav',
    sticky: 'fixed-top',
    static: 'navbar-static-top',
    hidden: 'd-none'
  }

  const bgColorCondition = navbarColor !== '' && navbarColor !== 'light' && navbarColor !== 'white'

  if (!isMounted) {
    return null
  }
  return (
    <div
      className={classnames(
        `wrapper vertical-layout ${navbarWrapperClasses[navbarType] || 'navbar-floating'} ${
          footerClasses[footerType] || 'footer-static'
        }`,
        {
          'vertical-menu-modern': windowWidth >= 1200,
          'menu-collapsed': menuCollapsed && windowWidth >= 1200,
          'menu-expanded': !menuCollapsed && windowWidth > 1200,

          'vertical-overlay-menu': windowWidth < 1200,
          'menu-hide': !menuVisibility && windowWidth < 1200,
          'menu-open': menuVisibility && windowWidth < 1200
        }
      )}
      {...(isHidden ? { 'data-col': '1-column' } : {})}
    >
      {!isHidden ? (
        <SidebarComponent
          skin={skin}
          menu={menu}
          menuData={menuData}
          menuCollapsed={menuCollapsed}
          menuVisibility={menuVisibility}
          setMenuCollapsed={setMenuCollapsed}
          setMenuVisibility={setMenuVisibility}
        />
      ) : null}

      <Navbar
        expand='lg'
        container={false}
        light={skin !== 'dark'}
        dark={skin === 'dark' || bgColorCondition}
        color={bgColorCondition ? navbarColor : undefined}
        className={classnames(
          `header-navbar navbar align-items-center ${navbarClasses[navbarType] || 'floating-nav'} navbar-shadow`
        )}
      >
        <div className='navbar-container d-flex content'>
          {navbar ? (
            navbar({ skin, setSkin, setMenuVisibility })
          ) : (
            <NavbarComponent setMenuVisibility={setMenuVisibility} skin={skin} setSkin={setSkin} />
          )}
        </div>
      </Navbar>
      {children}

      {                               }
      <div
        className={classnames('sidenav-overlay', {
          show: menuVisibility
        })}
        onClick={() => setMenuVisibility(false)}
      ></div>
      {                               }

      {themeConfig.layout.customizer === true ? (
        <Customizer
          skin={skin}
          isRtl={isRtl}
          layout={layout}
          setSkin={setSkin}
          setIsRtl={setIsRtl}
          isHidden={isHidden}
          setLayout={setLayout}
          footerType={footerType}
          navbarType={navbarType}
          setIsHidden={setIsHidden}
          themeConfig={themeConfig}
          navbarColor={navbarColor}
          contentWidth={contentWidth}
          setFooterType={setFooterType}
          setNavbarType={setNavbarType}
          setLastLayout={setLastLayout}
          menuCollapsed={menuCollapsed}
          setNavbarColor={setNavbarColor}
          setContentWidth={setContentWidth}
          setMenuCollapsed={setMenuCollapsed}
        />
      ) : null}

      {themeConfig.layout.scrollTop === true ? (
        <div className='scroll-to-top'>
          <ScrollToTop showOffset={300} className='scroll-top d-block'>
            <Button className='btn-icon' color='primary'>
              <ArrowUp size={14} />
            </Button>
          </ScrollToTop>
        </div>
      ) : null}
    </div>
  )
}

export default VerticalLayout