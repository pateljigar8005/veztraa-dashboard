import axios from 'axios'
import { Link } from 'react-router-dom'
import Avatar from '@components/avatar'
import { resolveAvatarUrl, getUserData, sortOptions } from '@utils'
import { persistTaskOrder } from './store'
import { priorityOptions, priorityColors, statusOptions, statusColors } from './todoOptions'
import AdvancedSearchModal from '../shared/AdvancedSearchModal'
import GripVerticalIcon from '../shared/GripVerticalIcon'
import classnames from 'classnames'
import { useState } from 'react'
import { ReactSortable } from 'react-sortablejs'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Menu, Search, Filter, MoreVertical } from 'react-feather'
import {
  Input,
  Badge,
  Button,
  InputGroup,
  DropdownMenu,
  DropdownItem,
  InputGroupText,
  DropdownToggle,
  UncontrolledDropdown
} from 'reactstrap'

// Status and Priority here are independent of the sidebar's own Status/
// Priority links (different param names - adv_status vs filter, this
// priority vs paramsURL.priority - see Todo::all()'s own note) precisely
// so they compose with Assignee/Due Date/Important in one combined search
// instead of just re-doing what a sidebar click already does alone.
//
// Assignee is isMulti for an admin only ("show me anything assigned to
// Alice or Bob") - a non-admin's results are already scoped to their own
// todos no matter what (see Todo::all()'s $userId ownership filter, always
// applied first and independent of this), so picking several assignees
// there wouldn't broaden what they can search, just add UI they don't
// need; a single picker keeps it simple for them.
const buildAdvancedSearchFields = isAdmin => [
  {
    name: 'assignee_id',
    label: 'Assignee',
    type: 'select',
    isMulti: isAdmin,
    fetchOptions: () =>
      axios.get('/users', { params: { perPage: 100 } }).then(response => sortOptions(response.data.data.users.map(u => ({ value: u.id, label: u.fullName }))))
  },
  { name: 'adv_status', label: 'Status', type: 'select', options: statusOptions },
  { name: 'priority', label: 'Priority', type: 'select', options: priorityOptions },
  {
    name: 'important',
    label: 'Important',
    type: 'select',
    options: [
      { value: '1', label: 'Important' },
      { value: '0', label: 'Not Important' }
    ]
  },
  { name: 'due_date', label: 'Due Date', type: 'date-range' }
]

const Tasks = props => {
  const {
    query,
    tasks,
    params,
    setSort,
    dispatch,
    getTasks,
    setQuery,
    updateTask,
    selectTask,
    reOrderTasks,
    handleTaskSidebar,
    handleMainSidebar,
    advancedFilters,
    setAdvancedFilters
  } = props

  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const advancedSearchFields = buildAdvancedSearchFields(getUserData()?.role === 'admin')

  const handleTaskClick = obj => {
    dispatch(selectTask(obj))
    handleTaskSidebar()
  }

  const renderPriorityBadge = priority => (
    <Badge className='text-capitalize' color={`light-${priorityColors[priority] || 'secondary'}`} pill>
      {priority}
    </Badge>
  )

  // A todo can have several assignees now - stacked, overlapping avatars
  // (same treatment Kanban's own task cards used) rather than one, with a
  // "+N" overflow avatar past the first 3 so a busy row doesn't just run
  // off the edge of the list.
  const renderAssignees = item => (
    <div className='d-flex align-items-center'>
      {item.assignees.slice(0, 3).map((a, index) => {
        const avatarUrl = resolveAvatarUrl(a.avatar)
        return (
          <Avatar
            key={a.id}
            size='sm'
            img={avatarUrl || undefined}
            initials={!avatarUrl}
            color={`light-${priorityColors[item.priority] || 'secondary'}`}
            content={a.fullName}
            title={a.fullName}
            style={{ marginLeft: index === 0 ? 0 : '-0.6rem', border: '2px solid #fff' }}
          />
        )
      })}
      {item.assignees.length > 3 && (
        <Avatar
          size='sm'
          color='light-secondary'
          content={`+${item.assignees.length - 3}`}
          title={item.assignees
            .slice(3)
            .map(a => a.fullName)
            .join(', ')}
          style={{ marginLeft: '-0.6rem', border: '2px solid #fff' }}
        />
      )}
    </div>
  )

  const renderTasks = () => {
    return (
      <PerfectScrollbar
        className='list-group todo-task-list-wrapper'
        options={{ wheelPropagation: false }}
        containerRef={ref => {
          if (ref) {
            ref._getBoundingClientRect = ref.getBoundingClientRect

            ref.getBoundingClientRect = () => {
              const original = ref._getBoundingClientRect()

              return { ...original, height: Math.floor(original.height) }
            }
          }
        }}
      >
        {tasks.length ? (
          <ReactSortable
            tag='ul'
            list={tasks}
            handle='.drag-icon'
            className='todo-task-list media-list'
            setList={newState => {
              dispatch(reOrderTasks(newState))
              dispatch(persistTaskOrder(newState.map(task => task.id)))
            }}
          >
            {tasks.map((item, index) => {
              return (
                <li
                  key={`${item.id}-${index}`}
                  onClick={() => handleTaskClick(item)}
                  className={classnames('todo-item', {
                    completed: item.isCompleted
                  })}
                >
                  <div className='todo-title-wrapper'>
                    <div className='todo-title-area'>
                      <GripVerticalIcon className='drag-icon' />
                      <div className='form-check'>
                        <Input
                          type='checkbox'
                          id={item.title}
                          checked={item.isCompleted}
                          onClick={e => e.stopPropagation()}
                          onChange={e => {
                            e.stopPropagation()
                            dispatch(updateTask({ id: item.id, status: e.target.checked ? 'completed' : 'not_started' }))
                          }}
                        />
                      </div>
                      <span className='todo-title'>{item.title}</span>
                    </div>
                    <div className='todo-item-action mt-lg-0 mt-50'>
                      {/* not_started/completed already read from the
                          checkbox + strikethrough (classnames({completed})
                          above) - this only calls out the states that
                          aren't otherwise visible at a glance: in progress,
                          in review, or stuck. */}
                      {item.status && item.status !== 'not_started' && item.status !== 'completed' && (
                        <div className='badge-wrapper me-1'>
                          <Badge className='text-capitalize' color={`light-${statusColors[item.status] || 'secondary'}`} pill>
                            {statusOptions.find(o => o.value === item.status)?.label || item.status}
                          </Badge>
                        </div>
                      )}
                      {item.priority ? <div className='badge-wrapper me-1'>{renderPriorityBadge(item.priority)}</div> : null}
                      {item.dueDate ? (
                        <small className='text-nowrap text-muted me-1'>
                          {new Date(item.dueDate).toLocaleString('default', { month: 'short' })}{' '}
                          {new Date(item.dueDate).getDate().toString().padStart(2, '0')}
                        </small>
                      ) : null}
                      {item.assignees && item.assignees.length > 0 ? renderAssignees(item) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ReactSortable>
        ) : (
          <div className='no-results show'>
            <h5>No Items Found</h5>
          </div>
        )}
      </PerfectScrollbar>
    )
  }

  const handleFilter = e => {
    setQuery(e.target.value)
    dispatch(getTasks(params))
  }

  const handleSort = (e, val) => {
    e.preventDefault()
    setSort(val)
    dispatch(getTasks({ ...params }))
  }

  return (
    <div className='todo-app-list'>
      <div className='app-fixed-search d-flex align-items-center'>
        <div className='sidebar-toggle cursor-pointer d-block d-lg-none ms-1' onClick={handleMainSidebar}>
          <Menu size={21} />
        </div>
        <div className='d-flex align-content-center justify-content-between w-100'>
          <InputGroup className='input-group-merge'>
            <InputGroupText>
              <Search className='text-muted' size={14} />
            </InputGroupText>
            <Input placeholder='Search task' value={query} onChange={handleFilter} />
          </InputGroup>
        </div>
        {/* Also the target of the navbar's own Search icon on this route
            (see NavbarBookmarks.js's isTodoRoute) - #navbar-advanced-
            search-trigger below is the same hidden-button pattern every
            other list page's Advanced Search uses, so this button here is
            just a second, always-visible way to reach the identical
            modal. */}
        <Button
          id='todo-advanced-search-trigger'
          color='flat-secondary'
          className='btn-icon me-50'
          onClick={() => setAdvancedSearchOpen(true)}
          title='Advanced Search'
        >
          <Filter size={16} className={Object.keys(advancedFilters).length ? 'text-primary' : 'text-body'} />
        </Button>
        <UncontrolledDropdown>
          <DropdownToggle className='hide-arrow me-1' tag='a' href='/' onClick={e => e.preventDefault()}>
            <MoreVertical className='text-body' size={16} />
          </DropdownToggle>
          <DropdownMenu end>
            <DropdownItem tag={Link} to='/' onClick={e => handleSort(e, 'title-asc')}>
              Sort A-Z
            </DropdownItem>
            <DropdownItem tag={Link} to='/' onClick={e => handleSort(e, 'title-desc')}>
              Sort Z-A
            </DropdownItem>
            <DropdownItem tag={Link} to='/' onClick={e => handleSort(e, 'assignee')}>
              Sort Assignee
            </DropdownItem>
            <DropdownItem tag={Link} to='/' onClick={e => handleSort(e, 'due-date')}>
              Sort Due Date
            </DropdownItem>
            <DropdownItem tag={Link} to='/' onClick={e => handleSort(e, '')}>
              Reset Sort
            </DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
      </div>
      <Button id='navbar-advanced-search-trigger' className='d-none' onClick={() => setAdvancedSearchOpen(true)} />
      <AdvancedSearchModal
        isOpen={advancedSearchOpen}
        toggle={() => setAdvancedSearchOpen(!advancedSearchOpen)}
        title='Advanced Search'
        fields={advancedSearchFields}
        values={advancedFilters}
        onApply={setAdvancedFilters}
        onClear={() => setAdvancedFilters({})}
      />
      {renderTasks()}
    </div>
  )
}

export default Tasks