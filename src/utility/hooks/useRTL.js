import { useEffect } from 'react'
import { handleRTL } from '@store/layout'
import { useDispatch, useSelector } from 'react-redux'

export const useRTL = () => {
  const dispatch = useDispatch()
  const isRtl = useSelector(state => state.layout.isRTL)

  const setValue = value => {
    dispatch(handleRTL(value))
  }

  useEffect(() => {
    const element = document.getElementsByTagName('html')[0]

    if (isRtl) {
      element.setAttribute('dir', 'rtl')
    } else {
      element.setAttribute('dir', 'ltr')
    }
  }, [isRtl])

  return [isRtl, setValue]
}