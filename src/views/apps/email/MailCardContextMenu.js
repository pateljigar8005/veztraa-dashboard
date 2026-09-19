import { useEffect, useRef } from 'react'
import { CornerUpLeft, CornerUpRight, Archive, Trash2 } from 'react-feather'

const MailCardContextMenu = ({ x, y, deleteLabel, onReply, onForward, onArchive, onDelete, onClose }) => {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleOutside = e => {
      if (!menuRef.current?.contains(e.target)) onClose()
    }
    const handleEscape = e => {
      if (e.key === 'Escape') onClose()
    }
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