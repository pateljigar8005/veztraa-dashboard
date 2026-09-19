import logo from '@src/assets/images/logo/logo.svg'
import logoFull from '@src/assets/images/logo/logo-full.svg'


const themeConfig = {
  app: {
    appName: 'Veztraa',
    appLogoImage: logo,
    appLogoImageFull: logoFull
  },
  layout: {
    isRTL: false,
    skin: 'light',
    type: 'vertical',
    contentWidth: 'full',
    menu: {
      isHidden: false,
      isCollapsed: false
    },
    navbar: {
      type: 'floating',
      backgroundColor: 'white'
    },
    footer: {
      type: 'static'
    },
    customizer: false,
    scrollTop: false,
    toastPosition: 'top-right'
  }
}

export default themeConfig