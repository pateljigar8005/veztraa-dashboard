import { Link } from 'react-router-dom'
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Mail, Star, Check, Trash } from 'react-feather'
import { Button, ListGroup, ListGroupItem } from 'reactstrap'
import { priorityOptions, priorityColors, statusOptions, statusColors } from './todoOptions'

const TodoSidebar = props => {
  const { handleTaskSidebar, setMainSidebar, mainSidebar, dispatch, getTasks, params } = props

  const handleFilter = filter => {
    dispatch(getTasks({ ...params, filter }))
  }

  const handlePriority = priority => {
    dispatch(getTasks({ ...params, priority }))
  }

  const handleActiveItem = value => {
    if ((params.filter && params.filter === value) || (params.priority && params.priority === value)) {
      return true
    } else {
      return false
    }
  }

  const handleAddClick = () => {
    handleTaskSidebar()
    setMainSidebar()
  }

  return (
    <div
      className={classnames('sidebar-left', {
        show: mainSidebar === true
      })}
    >
      <div className='sidebar'>
        <div className='sidebar-content todo-sidebar'>
          <div className='todo-app-menu'>
            <div className='add-task'>
              <Button color='primary' onClick={handleAddClick} block>
                Add Task
              </Button>
            </div>
            <PerfectScrollbar className='sidebar-menu-list' options={{ wheelPropagation: false }}>
              <ListGroup tag='div' className='list-group-filters'>
                <ListGroupItem
                  action
                  tag={Link}
                  to={'/todo/'}
                  active={params.filter === '' && params.priority === ''}
                  onClick={() => handleFilter('')}
                >
                  <Mail className='me-75' size={18} />
                  <span className='align-middle'>My Tasks</span>
                </ListGroupItem>
                <ListGroupItem
                  tag={Link}
                  to={'/todo/important'}
                  active={handleActiveItem('important')}
                  onClick={() => handleFilter('important')}
                  action
                >
                  <Star className='me-75' size={18} />
                  <span className='align-middle'>Important</span>
                </ListGroupItem>
                <ListGroupItem
                  tag={Link}
                  to={'/todo/completed'}
                  active={handleActiveItem('completed')}
                  onClick={() => handleFilter('completed')}
                  action
                >
                  <Check className='me-75' size={18} />
                  <span className='align-middle'>Completed</span>
                </ListGroupItem>
                <ListGroupItem
                  tag={Link}
                  to={'/todo/deleted'}
                  active={handleActiveItem('deleted')}
                  onClick={() => handleFilter('deleted')}
                  action
                >
                  <Trash className='me-75' size={18} />
                  <span className='align-middle'>Deleted</span>
                </ListGroupItem>
              </ListGroup>
              <div className='mt-3 px-2'>
                <h6 className='section-label mb-1'>Status</h6>
              </div>
              <ListGroup className='list-group-labels'>
                {statusOptions.map(option => (
                  <ListGroupItem
                    key={option.value}
                    active={handleActiveItem(option.value)}
                    className='d-flex align-items-center'
                    tag={Link}
                    to={`/todo/${option.value}`}
                    onClick={() => handleFilter(option.value)}
                    action
                  >
                    <span className={`bullet bullet-sm bullet-${statusColors[option.value]} me-1`}></span>
                    <span className='align-middle'>{option.label}</span>
                  </ListGroupItem>
                ))}
              </ListGroup>
              <div className='mt-3 px-2'>
                <h6 className='section-label mb-1'>Priority</h6>
              </div>
              <ListGroup className='list-group-labels'>
                {priorityOptions.map(option => (
                  <ListGroupItem
                    key={option.value}
                    active={handleActiveItem(option.value)}
                    className='d-flex align-items-center'
                    tag={Link}
                    to={`/todo/priority/${option.value}`}
                    onClick={() => handlePriority(option.value)}
                    action
                  >
                    <span className={`bullet bullet-sm bullet-${priorityColors[option.value]} me-1`}></span>
                    <span className='align-middle'>{option.label}</span>
                  </ListGroupItem>
                ))}
              </ListGroup>
            </PerfectScrollbar>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TodoSidebar