import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search as SearchIcon,
  X,
  Grid,
  Calendar,
  CheckSquare,
  Mail,
  Users,
  FileText,
  Briefcase,
  DollarSign,
  Folder,
  User,
  Lock,
  Clock,
  Settings,
  CreditCard,
  Globe
} from 'react-feather'
import { NavItem, NavLink, Modal, ModalBody, Spinner, UncontrolledTooltip } from 'reactstrap'
import axios from 'axios'
import useDebounce from '@hooks/useDebounce'
import { canAccessRoute } from '@src/utility/navPermissions'

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || navigator.userAgent || '')

// Grouped result order the API can return, kept stable regardless of which
// groups happen to have matches for a given query.
const GROUP_ORDER = ['clients', 'quotations', 'contracts', 'invoiceApp', 'projects', 'users']
const GROUP_ICON = {
  clients: Users,
  quotations: FileText,
  contracts: Briefcase,
  invoiceApp: DollarSign,
  projects: Folder,
  users: User
}

// Shown when the query is empty, laid out as two columns of two labeled
// groups each (matching the reference "intelligent search" layout). Each
// item is only shown when the current user can access its route.
const QUICK_LINK_COLUMNS = [
  [
    {
      label: 'Quick Links',
      items: [
        { title: 'Dashboard', path: '/dashboard', icon: Grid },
        { title: 'Calendar', path: '/calendar', icon: Calendar },
        { title: 'Todo', path: '/todo', icon: CheckSquare },
        { title: 'Email', path: '/email', icon: Mail }
      ]
    },
    {
      label: 'Sales',
      items: [
        { title: 'Clients', path: '/client', icon: Users },
        { title: 'Quotations', path: '/quotation', icon: FileText },
        { title: 'Contracts', path: '/contract', icon: Briefcase },
        { title: 'Invoices', path: '/invoice', icon: DollarSign }
      ]
    }
  ],
  [
    {
      label: 'People & Access',
      items: [
        { title: 'Users', path: '/user', icon: User },
        { title: 'Roles & Permissions', path: '/roles', icon: Lock },
        { title: 'Team Members', path: '/team-member', icon: Users },
        { title: 'Leave Approvals', path: '/leave-approvals', icon: Clock }
      ]
    },
    {
      label: 'Settings & Reports',
      items: [
        { title: 'Company Settings', path: '/company', icon: Settings },
        { title: 'Currencies', path: '/currency', icon: CreditCard },
        { title: 'Industries', path: '/industry', icon: Globe },
        { title: 'Activity Log', path: '/activity-log', icon: Clock }
      ]
    }
  ]
]

const getUserData = () => {
  try {
    return JSON.parse(localStorage.getItem('userData'))
  } catch (e) {
    return null
  }
}

const GlobalSearch = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const debouncedQuery = useDebounce(query, 300)
  const isSearching = query.trim().length >= 2

  const userData = getUserData()
  const visibleColumns = QUICK_LINK_COLUMNS.map(column =>
    column
      .map(group => ({ ...group, items: group.items.filter(item => canAccessRoute(item.path, userData)) }))
      .filter(group => group.items.length > 0)
  )

  const flatItems = isSearching
    ? groups.flatMap(g => g.items.map(item => ({ ...item, groupKey: g.key })))
    : visibleColumns.flat().flatMap(g => g.items)

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
    setActiveIndex(0)
  }, [query])

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
  const nextIndex = () => {
    runningIndex += 1
    return runningIndex
  }

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

      <Modal isOpen={isOpen} toggle={close} className='modal-dialog-centered modal-lg global-search-modal' contentClassName='p-0'>
        <div className='d-flex align-items-center px-1_5 px-3 py-1' style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <SearchIcon size={20} className='text-muted me-1' />
          <input
            ref={inputRef}
            className='border-0 flex-grow-1'
            style={{ outline: 'none', background: 'transparent', fontSize: '1.15rem' }}
            placeholder='Search clients, invoices, contracts, quotations, projects, users...'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyNav}
          />
          {loading && <Spinner size='sm' className='mx-50' />}
          <span className='text-muted mx-1' style={{ fontSize: '0.85rem' }}>
            [esc]
          </span>
          <X size={20} className='cursor-pointer text-muted' onClick={close} />
        </div>
        <ModalBody className='p-2' style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {!isSearching && (
            <div className='row'>
              {visibleColumns.map((column, colIndex) => (
                <div className='col-12 col-md-6' key={colIndex}>
                  {column.map(group => (
                    <div className='mb-2' key={group.label}>
                      <div
                        className='text-muted text-uppercase fw-bold mb-50'
                        style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}
                      >
                        {group.label}
                      </div>
                      {group.items.map(item => {
                        const index = nextIndex()
                        const Icon = item.icon
                        return (
                          <div
                            key={item.path}
                            className={`d-flex align-items-center gap-1 py-50 px-50 rounded cursor-pointer ${index === activeIndex ? 'bg-light-primary' : ''}`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => goTo(item)}
                          >
                            <Icon size={16} className='text-muted' />
                            <span>{item.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {isSearching && !loading && groups.length === 0 && (
            <div className='text-muted text-center py-3'>No results found</div>
          )}

          {isSearching &&
            groups.map(group => {
              const GroupIcon = GROUP_ICON[group.key] || FileText
              return (
                <div key={group.key} className='mb-1'>
                  <div
                    className='px-50 pt-50 pb-25 text-muted text-uppercase fw-bold'
                    style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}
                  >
                    {group.label}
                  </div>
                  {group.items.map(item => {
                    const index = nextIndex()
                    return (
                      <div
                        key={`${group.key}-${item.id}`}
                        className={`d-flex align-items-center gap-1 px-50 py-50 rounded cursor-pointer ${index === activeIndex ? 'bg-light-primary' : ''}`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => goTo(item)}
                      >
                        <GroupIcon size={16} className='text-muted' />
                        <div className='flex-grow-1'>
                          <div className='fw-bold'>{item.title}</div>
                          {item.subtitle && <small className='text-muted'>{item.subtitle}</small>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
        </ModalBody>
      </Modal>
    </>
  )
}

export default GlobalSearch
