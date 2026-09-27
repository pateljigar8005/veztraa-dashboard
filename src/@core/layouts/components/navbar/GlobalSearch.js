import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, X } from 'react-feather'
import { NavItem, NavLink, Modal, ModalBody, Input, Spinner, UncontrolledTooltip } from 'reactstrap'
import axios from 'axios'
import useDebounce from '@hooks/useDebounce'

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || navigator.userAgent || '')

// Grouped result order the API can return, kept stable regardless of which
// groups happen to have matches for a given query.
const GROUP_ORDER = ['clients', 'quotations', 'contracts', 'invoiceApp', 'projects', 'users']

const GlobalSearch = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const debouncedQuery = useDebounce(query, 300)

  const flatItems = groups.flatMap(g => g.items.map(item => ({ ...item, groupKey: g.key })))

  const close = () => {
    setIsOpen(false)
    setQuery('')
    setGroups([])
    setActiveIndex(0)
  }

  const open = () => setIsOpen(true)

  useEffect(() => {
    const handleKeyDown = e => {
      const modifierPressed = isMac ? e.metaKey : e.ctrlKey
      if (modifierPressed && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 2) {
      setGroups([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    axios
      .get('/search', { params: { q }, signal: controller.signal })
      .then(response => {
        const returned = response.data?.data?.groups || []
        const sorted = [...returned].sort((a, b) => GROUP_ORDER.indexOf(a.key) - GROUP_ORDER.indexOf(b.key))
        setGroups(sorted)
        setActiveIndex(0)
      })
      .catch(err => {
        if (axios.isCancel(err) || err.name === 'CanceledError') return
        setGroups([])
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [debouncedQuery])

  const goTo = item => {
    if (!item) return
    close()
    navigate(item.path)
  }

  const handleKeyNav = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      goTo(flatItems[activeIndex])
    } else if (e.key === 'Escape') {
      close()
    }
  }

  let runningIndex = -1

  return (
    <>
      <NavItem className='d-none d-lg-block'>
        <NavLink className='nav-link-style' id='navbar-global-search-btn' onClick={open}>
          <SearchIcon className='ficon' />
        </NavLink>
        <UncontrolledTooltip placement='bottom' target='navbar-global-search-btn'>
          Search everything ({isMac ? '⌘' : 'Ctrl'}+K)
        </UncontrolledTooltip>
      </NavItem>

      <Modal isOpen={isOpen} toggle={close} className='modal-dialog-centered' contentClassName='p-0'>
        <div className='p-1 border-bottom d-flex align-items-center'>
          <SearchIcon size={18} className='text-muted mx-50' />
          <Input
            innerRef={inputRef}
            bsSize='lg'
            className='border-0 shadow-none'
            placeholder='Search clients, invoices, contracts, quotations, projects, users...'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyNav}
          />
          {loading && <Spinner size='sm' className='mx-50' />}
          <X size={18} className='cursor-pointer text-muted mx-50' onClick={close} />
        </div>
        <ModalBody className='p-0' style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {query.trim().length >= 2 && !loading && groups.length === 0 && (
            <div className='text-muted text-center py-3'>No results found</div>
          )}
          {groups.map(group => (
            <div key={group.key}>
              <div className='px-1 pt-1 pb-25 text-muted text-uppercase' style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                {group.label}
              </div>
              {group.items.map(item => {
                runningIndex += 1
                const index = runningIndex
                return (
                  <div
                    key={`${group.key}-${item.id}`}
                    className={`px-1 py-50 cursor-pointer ${index === activeIndex ? 'bg-light-primary' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goTo(item)}
                  >
                    <div className='fw-bold'>{item.title}</div>
                    {item.subtitle && <small className='text-muted'>{item.subtitle}</small>}
                  </div>
                )
              })}
            </div>
          ))}
          {query.trim().length > 0 && query.trim().length < 2 && (
            <div className='text-muted text-center py-3'>Keep typing to search...</div>
          )}
        </ModalBody>
      </Modal>
    </>
  )
}

export default GlobalSearch
