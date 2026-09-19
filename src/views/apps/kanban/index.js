import { useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { useForm, Controller } from 'react-hook-form'
import { Button, Input, FormText } from 'reactstrap'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBoards, fetchTasks, addBoard } from './store'
import TaskSidebar from './TaskSidebar'
import KanbanBoards from './KanbanBoards'
import '@styles/react/apps/app-kanban.scss'

const defaultValues = {
  boardTitle: ''
}

const KanbanBoard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddBoard, setShowAddBoard] = useState(false)

  const dispatch = useDispatch()
  const store = useSelector(state => state.kanban)
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  const handleAddBoardReset = () => {
    reset()
    setShowAddBoard(false)
  }

  const handleOpenAddBoard = () => {
    reset()
    setShowAddBoard(true)
  }

  const handleAddBoardFormSubmit = data => {
    dispatch(addBoard({ title: data.boardTitle }))
    handleAddBoardReset()
  }

  const handleTaskSidebarToggle = () => setSidebarOpen(!sidebarOpen)

  const renderBoards = () => {
    return store.boards.map((board, index) => {
      const isLastBoard = store.boards[store.boards.length - 1].id === board.id

      return (
        <KanbanBoards
          store={store}
          board={board}
          isLastBoard={isLastBoard}
          key={`${board.id}-${index}`}
          index={`${board.id}-${index}`}
          handleTaskSidebarToggle={handleTaskSidebarToggle}
        />
      )
    })
  }

  const renderAddBoardForm = () => {
    return showAddBoard ? (
      <form onSubmit={handleSubmit(handleAddBoardFormSubmit)}>
        <div className='mb-50'>
          <Controller
            name='boardTitle'
            control={control}
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <Input
                autoFocus
                value={value}
                id='board-title'
                onChange={onChange}
                placeholder='Board Title'
                invalid={Boolean(errors.boardTitle)}
                aria-describedby='validation-add-board'
              />
            )}
          />
          {errors.boardTitle && (
            <FormText color='danger' id='validation-add-board'>
              Please enter a valid Board Title
            </FormText>
          )}
        </div>
        <div>
          <Button color='primary' size='sm' type='submit' className='me-75'>
            Add
          </Button>
          <Button outline size='sm' color='secondary' onClick={handleAddBoardReset}>
            Cancel
          </Button>
        </div>
      </form>
    ) : null
  }

  useEffect(() => {
    dispatch(fetchBoards())
    dispatch(fetchTasks())
  }, [dispatch])

  return store.boards ? (
    <div className='app-kanban-wrapper'>
      {renderBoards()}

      <div className='ms-1' style={{ minWidth: 150 }}>
        {!showAddBoard ? (
          <Button size='sm' color='light-secondary' onClick={handleOpenAddBoard}>
            <Plus size={14} className='me-25' />
            <span className='align-middle'> Add Board</span>
          </Button>
        ) : (
          renderAddBoardForm()
        )}
      </div>

      <TaskSidebar sidebarOpen={sidebarOpen} selectedTask={store.selectedTask} handleTaskSidebarToggle={handleTaskSidebarToggle} />
    </div>
  ) : null
}

export default KanbanBoard