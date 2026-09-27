import { Fragment } from 'react'
import NavbarUser from './NavbarUser'
import NavbarBookmarks from './NavbarBookmarks'
import GlobalSearch from './GlobalSearch'

const ThemeNavbar = props => {
  const { skin, setSkin, setMenuVisibility } = props

  return (
    <Fragment>
      <div className='bookmark-wrapper d-flex align-items-center'>
        <NavbarBookmarks setMenuVisibility={setMenuVisibility} />
      </div>
      <GlobalSearch />
      <NavbarUser skin={skin} setSkin={setSkin} />
    </Fragment>
  )
}

export default ThemeNavbar