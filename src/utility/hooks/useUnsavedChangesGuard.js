import { useEffect } from 'react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const PROGRAMMATIC_NAV_SELECTOR = '#navbar-back-btn, #navbar-add-btn'

export const useUnsavedChangesGuard = isDirty => {
  useEffect(() => {
    const handleBeforeUnload = event => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (!isDirty) return

    let bypassNextClick = false

    const handleClick = event => {
      if (bypassNextClick) {
        bypassNextClick = false
        return
      }

      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const link = event.target.closest('a[href]')
      const navButton = event.target.closest(PROGRAMMATIC_NAV_SELECTOR)
      const target = navButton || link

      if (!target) return

      if (link) {
        if (link.target === '_blank' || link.hasAttribute('download')) return
        const url = new URL(link.href, window.location.origin)
        if (url.origin !== window.location.origin) return
        const destination = `${url.pathname}${url.search}${url.hash}`
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
        if (destination === current) return
      }

      event.preventDefault()
      event.stopPropagation()

      MySwal.fire({
        title: 'Discard unsaved changes?',
        text: 'You have unsaved changes that will be lost if you leave this page.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, leave',
        cancelButtonText: 'Stay',
        customClass: {
          confirmButton: 'btn btn-danger',
          cancelButton: 'btn btn-outline-secondary ms-1'
        },
        buttonsStyling: false
      }).then(result => {
        if (result.isConfirmed) {
          bypassNextClick = true
          target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
        }
      })
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [isDirty])
}