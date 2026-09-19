import { handleNavbarColor } from '@store/layout'
import { useDispatch, useSelector } from 'react-redux'

export const useNavbarColor = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.layout)

  const setNavbarColor = value => {
    dispatch(handleNavbarColor(value))
  }

  return { navbarColor: store.navbarColor, setNavbarColor }
}