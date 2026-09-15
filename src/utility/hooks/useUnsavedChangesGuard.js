// ** React Imports
import { useEffect } from 'react'

// ** Third Party Components
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

// A handful of navbar icons (see NavbarBookmarks.js) navigate purely via
// onClick - navigate(-1)/navigate(addRoute) - with no real href for the
// click-interceptor below to find. They're matched by id here instead; add
// a new id to this list if a future navbar icon does the same thing.
const PROGRAMMATIC_NAV_SELECTOR = '#navbar-back-btn, #navbar-add-btn'

// Warns before leaving a form with unsaved edits, two ways:
//
// 1. Browser-level exits (tab close, refresh, typing a new URL) - the native
//    'beforeunload' prompt.
// 2. In-app navigation (sidebar/menu/breadcrumb links, and the navbar's
//    Back/Add icons) - react-router here is v6.3 on a plain <BrowserRouter>
//    (not a data router), so there's no useBlocker to hook into. Instead
//    this intercepts the click in the capture phase, before react-router's
//    own Link handler (or the navbar icon's onClick) runs, and only lets it
//    through if confirmed - by re-dispatching the same click rather than
//    re-implementing what it does, which also means the fix works for any
//    href-based link automatically. Does NOT catch the browser back/forward
//    button (popstate isn't cancelable) - only a createBrowserRouter
//    migration would cover that.
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

    // Set right before re-dispatching a confirmed click, so that one replay
    // skips interception instead of re-prompting forever.
    let bypassNextClick = false

    const handleClick = event => {
      if (bypassNextClick) {
        bypassNextClick = false
        return
      }

      // Only a plain left click is a candidate - skip modified clicks (new
      // tab/window) and anything the target already handled itself.
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
