import { handleNavbarType } from '@store/layout'
import { useDispatch, useSelector } from 'react-redux'

export const useNavbarType = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.layout)

  const setNavbarType = type => {
    dispatch(handleNavbarType(type))
  }

  return { navbarType: store.navbarType, setNavbarType }
}