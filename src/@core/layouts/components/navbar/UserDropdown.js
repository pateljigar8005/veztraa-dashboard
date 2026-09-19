import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Avatar from '@components/avatar'
import { isUserLoggedIn, resolveAvatarUrl } from '@utils'
import useJwt from '@src/auth/jwt/useJwt'
import { useDispatch } from 'react-redux'
import { handleLogout } from '@store/authentication'
import { Settings, Lock, Power } from 'react-feather'
import { UncontrolledDropdown, DropdownMenu, DropdownToggle, DropdownItem } from 'reactstrap'

const UserDropdown = () => {
  const dispatch = useDispatch()

  const [userData, setUserData] = useState(null)

  useEffect(() => {
    if (isUserLoggedIn() !== null) {
      setUserData(JSON.parse(localStorage.getItem('userData')))
    }
  }, [])

  const displayName = (userData && userData.fullName) || 'John Doe'

  return (
    <UncontrolledDropdown tag='li' className='dropdown-user nav-item'>
      <DropdownToggle href='/' tag='a' className='nav-link dropdown-user-link' onClick={e => e.preventDefault()}>
        <div className='user-nav d-sm-flex d-none'>
          <span className='user-name fw-bold'>{displayName}</span>
          <span className='user-status'>{(userData && userData.role) || 'Admin'}</span>
        </div>
        {userData && userData.avatar ? (
          <Avatar img={resolveAvatarUrl(userData.avatar)} imgHeight='40' imgWidth='40' />
        ) : (
          <Avatar initials content={displayName} color='light-primary' imgHeight='40' imgWidth='40' />
        )}
      </DropdownToggle>
      <DropdownMenu end>
        <DropdownItem tag={Link} to='/account-settings'>
          <Settings size={14} className='me-75' />
          <span className='align-middle'>Account Settings</span>
        </DropdownItem>
        <DropdownItem tag={Link} to='/change-password'>
          <Lock size={14} className='me-75' />
          <span className='align-middle'>Change Password</span>
        </DropdownItem>
        <DropdownItem divider />
        <DropdownItem
          tag={Link}
          to='/login'
          onClick={() => useJwt.logout().finally(() => dispatch(handleLogout()))}
        >
          <Power size={14} className='me-75' />
          <span className='align-middle'>Logout</span>
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  )
}

export default UserDropdown