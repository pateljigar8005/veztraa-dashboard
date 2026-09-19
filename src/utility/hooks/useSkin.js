import { useEffect } from 'react'
import { handleSkin } from '@store/layout'
import { useDispatch, useSelector } from 'react-redux'

export const useSkin = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.layout)

  const setSkin = type => {
    dispatch(handleSkin(type))
  }

  useEffect(() => {
    const element = window.document.body

    const classNames = {
      dark: 'dark-layout',
      bordered: 'bordered-layout',
      'semi-dark': 'semi-dark-layout'
    }

    element.classList.remove(...element.classList)

    if (store.skin !== 'light') {
      element.classList.add(classNames[store.skin])
    }
  }, [store.skin])

  return { skin: store.skin, setSkin }
}