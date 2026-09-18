// ** React Imports
import { useEffect, useRef } from 'react'

// ** Third Party Components
import { CornerUpLeft, CornerUpRight, Archive, Trash2 } from 'react-feather'

// A plain right-click menu positioned at the cursor - reactstrap's own
// Dropdown anchors to a toggle element, not arbitrary coordinates, so this
// just reuses Bootstrap's existing .dropdown-menu/.dropdown-item classes
// (already loaded app-wide) rather than pulling in a dedicated library for
// what's otherwise a few positioned links.
const MailCardContextMenu = ({ x, y, deleteLabel, onReply, onForward, onArchive, onDelete, onClose }) => {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleOutside = e => {
      if (!menuRef.current?.contains(e.target)) onClose()
    }
    const handleEscape = e => {
      if (e.key === 'Escape') onClose()
    }
    // Capture phase + a tick later so the click that opened this menu
    // (already a contextmenu event, not a click) never immediately closes it.
    const id = setTimeout(() => {
      document.addEventListener('click', handleOutside, true)
      document.addEventListener('contextmenu', handleOutside, true)
    }, 0)
    document.addEventListener('keydown', handleEscape)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', handleOutside, true)
      document.removeEventListener('contextmenu', handleOutside, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const item = (Icon, label, onClick) => (
    <a
      href='/'
      className='dropdown-item d-flex align-items-center'
      onClick={e => {
        e.preventDefault()
        onClick()
        onClose()
      }}
    >
      <Icon size={14} className='me-50' />
      {label}
    </a>
  )

  // The theme's own dropdown CSS (_dropdown.scss) collapses every
  // .dropdown-menu to scale(1, 0) by default and only restores it via a
  // `.show > .dropdown-menu` direct-child selector - it expects `show` on a
  // wrapping .dropdown element, not on the menu itself. Since this is a
  // plain cursor-positioned menu with no such wrapper, that selector never
  // matches, so the transform has to be overridden directly here or the
  // menu renders with zero height despite `display: block`.
  return (
    <div
      ref={menuRef}
      className='dropdown-menu show'
      style={{ position: 'fixed', top: y, left: x, zIndex: 1090, transform: 'scale(1, 1)' }}
    >
      {onReply && item(CornerUpLeft, 'Reply', onReply)}
      {onForward && item(CornerUpRight, 'Forward', onForward)}
      {onArchive && item(Archive, 'Archive', onArchive)}
      {item(Trash2, deleteLabel, onDelete)}
    </div>
  )
}

export default MailCardContextMenu
