// ** Reactstrap Imports
import { Badge, Card, CardBody } from 'reactstrap'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Third Party Imports
import { MessageSquare, Calendar } from 'react-feather'

// ** Redux Imports
import { useDispatch } from 'react-redux'

// ** Actions
import { handleSelectTask } from './store'
import { taskTypeColors, priorityColors } from './kanbanOptions'

// ** Utils
import { resolveAvatarUrl } from '@utils'

const KanbanTasks = props => {
  // ** Props
  const { task, handleTaskSidebarToggle } = props

  // ** Hooks
  const dispatch = useDispatch()

  const handleTaskClick = () => {
    dispatch(handleSelectTask(task))
    handleTaskSidebarToggle()
  }

  return (
    <Card onClick={handleTaskClick} className='task' data-board-id={task.board_id} data-task-id={task.id}>
      <CardBody data-task-id={task.id}>
        <div className='mb-1'>
          <Badge pill color={`light-${taskTypeColors[task.task_type] || 'primary'}`} className='text-capitalize me-50'>
            {task.task_type}
          </Badge>
          <Badge pill color={`light-${priorityColors[task.priority] || 'secondary'}`} className='text-capitalize'>
            {task.priority}
          </Badge>
        </div>

        <span className='task-title'>{task.title}</span>

        <div className='task-footer d-flex align-items-center justify-content-between mt-1'>
          <div className='d-flex align-items-center'>
            {task.due_date && (
              <div className='d-flex align-items-center me-75 text-muted'>
                <Calendar size={14} className='me-25' />
                <small>{task.due_date}</small>
              </div>
            )}
            {task.comment_count > 0 && (
              <div className='d-flex align-items-center text-muted'>
                <MessageSquare size={14} className='me-25' />
                <small>{task.comment_count}</small>
              </div>
            )}
          </div>
          {task.assignees && task.assignees.length > 0 && (
            <div className='d-flex align-items-center'>
              {task.assignees.slice(0, 3).map((assignee, index) => (
                <Avatar
                  key={assignee.id}
                  initials
                  size='sm'
                  color='light-primary'
                  content={assignee.name}
                  title={assignee.name}
                  img={resolveAvatarUrl(assignee.avatar) || undefined}
                  style={{ marginLeft: index === 0 ? 0 : '-0.6rem', border: '2px solid #fff' }}
                />
              ))}
              {task.assignees.length > 3 && (
                <Avatar
                  size='sm'
                  color='light-secondary'
                  content={`+${task.assignees.length - 3}`}
                  title={task.assignees
                    .slice(3)
                    .map(a => a.name)
                    .join(', ')}
                  style={{ marginLeft: '-0.6rem', border: '2px solid #fff' }}
                />
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default KanbanTasks
