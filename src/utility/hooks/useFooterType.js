import { handleFooterType } from '@store/layout'
import { useDispatch, useSelector } from 'react-redux'

export const useFooterType = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.layout)

  const setFooterType = type => {
    dispatch(handleFooterType(type))
  }

  return { setFooterType, footerType: store.footerType }
}