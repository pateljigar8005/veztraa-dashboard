import { Link } from 'react-router-dom'
import Avatar from '@components/avatar'
import { resolveAvatarUrl } from '@utils'
import { persistTaskOrder } from './store'
import { priorityColors } from '../kanban/kanbanOptions'
import classnames from 'classnames'
import { ReactSortable } from 'react-sortablejs'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Menu, Search, MoreVertical } from 'react-feather'
import {
  Input,
  Badge,
  InputGroup,
  DropdownMenu,
  DropdownItem,
  InputGroupText,
  DropdownToggle,
  UncontrolledDropdown
} from 'reactstrap'

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
    handleMainSidebar
  } = props

  const handleTaskClick = obj => {
    dispatch(selectTask(obj))
    handleTaskSidebar()
  }

  const renderPriorityBadge = priority => (
    <Badge className='text-capitalize' color={`light-${priorityColors[priority] || 'secondary'}`} pill>
      {priority}
    </Badge>
  )

  const renderAvatar = obj => {
    const item = obj.assignee
    const avatarUrl = resolveAvatarUrl(item.avatar)

    if (avatarUrl) {
      return <Avatar img={avatarUrl} imgHeight='32' imgWidth='32' />
    }
    return <Avatar color={`light-${priorityColors[obj.priority] || 'secondary'}`} content={item.fullName} initials />
  }

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
                      <MoreVertical className='drag-icon' />
                      <div className='form-check'>
                        <Input
                          type='checkbox'
                          id={item.title}
                          checked={item.isCompleted}
                          onClick={e => e.stopPropagation()}
                          onChange={e => {
                            e.stopPropagation()
                            dispatch(updateTask({ id: item.id, is_completed: e.target.checked }))
                          }}
                        />
                      </div>
                      <span className='todo-title'>{item.title}</span>
                    </div>
                    <div className='todo-item-action mt-lg-0 mt-50'>
                      {item.priority ? <div className='badge-wrapper me-1'>{renderPriorityBadge(item.priority)}</div> : null}
                      {item.dueDate ? (
                        <small className='text-nowrap text-muted me-1'>
                          {new Date(item.dueDate).toLocaleString('default', { month: 'short' })}{' '}
                          {new Date(item.dueDate).getDate().toString().padStart(2, '0')}
                        </small>
                      ) : null}
                      {item.assignee ? renderAvatar(item) : null}
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
      {renderTasks()}
    </div>
  )
}

export default Tasks