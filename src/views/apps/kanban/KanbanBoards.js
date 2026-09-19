import { useState, useEffect, Fragment } from 'react'
import { Input, Button, FormText, DropdownMenu, DropdownItem, DropdownToggle, UncontrolledDropdown } from 'reactstrap'
import { ReactSortable } from 'react-sortablejs'
import { useForm, Controller } from 'react-hook-form'
import { Plus, MoreVertical } from 'react-feather'
import { useDispatch } from 'react-redux'
import { addTask, clearTasks, deleteBoard, reorderTasks, moveTaskToBoard, updateBoardTitle } from './store'
import KanbanTasks from './KanbanTasks'

const defaultValues = {
  taskTitle: ''
}

const KanbanBoard = props => {
  const { board, index, store, handleTaskSidebarToggle } = props

  const [title, setTitle] = useState('')
  const [showAddTask, setShowAddTask] = useState(null)

  const dispatch = useDispatch()
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  useEffect(() => {
    setTitle(board.title)
  }, [board.title])

  const handleAddTaskReset = () => {
    reset()
    setShowAddTask(null)
  }

  const handleOpenAddTask = () => {
    reset()
    setShowAddTask(board.id)
  }

  const handleClearTasks = () => {
    dispatch(clearTasks(board.id))
  }

  const handleDeleteBoard = () => {
    dispatch(deleteBoard(board.id))
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== board.title) {
      dispatch(updateBoardTitle({ id: board.id, title: title.trim() }))
    } else {
      setTitle(board.title)
    }
  }

  const handleAddTaskFormSubmit = data => {
    dispatch(addTask({ board_id: board.id, title: data.taskTitle }))
    handleAddTaskReset()
  }

  const renderAddTaskForm = () => {
    return board.id === showAddTask ? (
      <form onSubmit={handleSubmit(handleAddTaskFormSubmit)}>
        <div className='mb-1'>
          <Controller
            name='taskTitle'
            control={control}
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <Input
                autoFocus
                rows='2'
                value={value}
                type='textarea'
                id='task-title'
                onChange={onChange}
                placeholder='Add Content'
                invalid={errors.taskTitle && true}
                aria-describedby='validation-add-task'
              />
            )}
          />
          {errors.taskTitle && (
            <FormText color='danger' id='validation-add-task'>
              Please enter a valid Task Title
            </FormText>
          )}
        </div>
        <div>
          <Button color='primary' size='sm' type='submit' className='me-75'>
            Add
          </Button>
          <Button outline size='sm' color='secondary' onClick={handleAddTaskReset}>
            Cancel
          </Button>
        </div>
      </form>
    ) : null
  }

  const sortTaskOnSameBoard = ev => {
    if (ev.from.classList[1] === ev.to.classList[1]) {
      dispatch(
        reorderTasks({
          taskId: ev.item.dataset.taskId,
          targetTaskId: ev.originalEvent.target.dataset.taskId
        })
      )
    }
  }

  const moveTaskToAnotherBoard = ev => {
    dispatch(
      moveTaskToBoard({
        taskId: ev.item.dataset.taskId,
        newBoardId: ev.to.classList[1].replace('board-', '')
      })
    )
  }

  return (
    <Fragment key={index}>
      <div className='board-wrapper'>
        <div className='d-flex align-items-center justify-content-between'>
          <div className='d-flex align-items-center board-header'>
            <Input
              className='board-title'
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
            />
          </div>
          <UncontrolledDropdown className='more-options-dropdown'>
            <DropdownToggle className='btn-icon' color='transparent' size='sm'>
              <MoreVertical size={20} />
            </DropdownToggle>
            <DropdownMenu end>
              <DropdownItem
                href='/'
                onClick={e => {
                  e.preventDefault()
                  handleClearTasks()
                }}
              >
                Clear Tasks
              </DropdownItem>
              <DropdownItem
                href='/'
                onClick={e => {
                  e.preventDefault()
                  handleDeleteBoard()
                }}
              >
                Delete Board
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        </div>
        <div className='board-content'>
          <ReactSortable
            list={store.tasks}
            group='shared-group'
            setList={() => null}
            onChange={sortTaskOnSameBoard}
            onAdd={moveTaskToAnotherBoard}
            className={`tasks-wrapper board-${board.id}`}
          >
            {store.tasks.map((task, taskIndex) => {
              if (task.board_id === board.id) {
                return (
                  <KanbanTasks
                    task={task}
                    index={taskIndex}
                    key={`${task.board_id}-${taskIndex}`}
                    handleTaskSidebarToggle={handleTaskSidebarToggle}
                  />
                )
              } else {
                return <Fragment key={`${task.board_id}-${taskIndex}`}></Fragment>
              }
            })}
          </ReactSortable>

          {showAddTask === null || (showAddTask !== null && showAddTask !== board.id) ? (
            <Button size='sm' color='flat-secondary' onClick={handleOpenAddTask}>
              <Plus size={14} className='me-25' />
              <span className='align-middle'>Add New Task</span>
            </Button>
          ) : (
            renderAddTaskForm()
          )}
        </div>
      </div>
    </Fragment>
  )
}

export default KanbanBoard