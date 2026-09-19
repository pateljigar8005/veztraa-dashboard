import { Fragment, useEffect, memo } from 'react'
import classnames from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import { handleContentWidth, handleMenuCollapsed, handleMenuHidden } from '@store/layout'
import themeConfig from '@configs/themeConfig'
import 'animate.css/animate.css'

const LayoutWrapper = props => {
  const { children, routeMeta } = props

  const dispatch = useDispatch()
  const store = useSelector(state => state)

  const navbarStore = store.navbar
  const layoutStored = store.layout.layout
  const contentWidth = store.layout.contentWidth
  const appLayoutCondition =
    (layoutStored.layout === 'horizontal' && !routeMeta) ||
    (layoutStored.layout === 'horizontal' && routeMeta && !routeMeta.appLayout)
  const Tag = appLayoutCondition ? 'div' : Fragment

  const cleanUp = () => {
    if (routeMeta) {
      if (routeMeta.contentWidth && routeMeta.contentWidth === store.layout.contentWidth) {
        dispatch(handleContentWidth(themeConfig.layout.contentWidth))
      }
      if (routeMeta.menuCollapsed && routeMeta.menuCollapsed === store.layout.menuCollapsed) {
        dispatch(handleMenuCollapsed(!store.layout.menuCollapsed))
      }
      if (routeMeta.menuHidden && routeMeta.menuHidden === store.layout.menuHidden) {
        dispatch(handleMenuHidden(!store.layout.menuHidden))
      }
    }
  }

  useEffect(() => {
    if (routeMeta) {
      if (routeMeta.contentWidth) {
        dispatch(handleContentWidth(routeMeta.contentWidth))
      }
      if (routeMeta.menuCollapsed) {
        dispatch(handleMenuCollapsed(routeMeta.menuCollapsed))
      }
      if (routeMeta.menuHidden) {
        dispatch(handleMenuHidden(routeMeta.menuHidden))
      }
    }
    return () => cleanUp()
  }, [routeMeta])

  return (
    <div
      className={classnames('app-content content overflow-hidden', {
        [routeMeta ? routeMeta.className : '']: routeMeta && routeMeta.className,
        'show-overlay': navbarStore.query.length
      })}
    >
      <div className='content-overlay'></div>
      <div className='header-navbar-shadow' />
      <div
        className={classnames({
          'content-wrapper': routeMeta && !routeMeta.appLayout,
          'content-area-wrapper': routeMeta && routeMeta.appLayout,
          'container-xxl p-0': contentWidth === 'boxed'
        })}
      >
        <Tag {...(appLayoutCondition ? { className: 'content-body' } : {})}>{children}</Tag>
      </div>
    </div>
  )
}

export default memo(LayoutWrapper)