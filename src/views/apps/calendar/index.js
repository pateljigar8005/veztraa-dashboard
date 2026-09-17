// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Third Party Components
import classnames from 'classnames'
import { Row, Col } from 'reactstrap'

// ** Calendar App Component Imports
import Calendar from './Calendar'
import SidebarLeft from './SidebarLeft'
import AddEventSidebar from './AddEventSidebar'

// ** Kanban/Todo Task Details popups - a Kanban/Todo-sourced calendar event
// opens the real task in the same popup those modules use themselves,
// instead of navigating away to /kanban or /todo.
import KanbanTaskSidebar from '../kanban/TaskSidebar'
import TodoTaskSidebar from '../todo/TaskSidebar'

// ** Custom Hooks
import { useRTL } from '@hooks/useRTL'

// ** Store & Actions
import { useSelector, useDispatch } from 'react-redux'
import {
  fetchEvents,
  fetchKanbanTaskEvents,
  fetchTodoTaskEvents,
  selectEvent,
  updateEvent,
  updateFilter,
  updateAllFilters,
  toggleTaskFilter,
  addEvent,
  removeEvent
} from './store'
import { handleSelectTask } from '../kanban/store'
import { selectTask, updateTask as updateTodoTask, addTask as addTodoTask, deleteTask as deleteTodoTask } from '../todo/store'

// ** Styles
import '@styles/react/apps/app-calendar.scss'

// ** CalendarColors
const calendarsColor = {
  Business: 'primary',
  Holiday: 'success',
  Personal: 'danger',
  Family: 'warning',
  ETC: 'info',
  'Kanban Tasks': 'secondary',
  'To-Do': 'dark'
}

const CalendarComponent = () => {
  // ** Variables
  const dispatch = useDispatch()
  const store = useSelector(state => state.calendar)
  const kanbanStore = useSelector(state => state.kanban)
  const todoStore = useSelector(state => state.todo)

  // ** states
  const [calendarApi, setCalendarApi] = useState(null)
  const [addSidebarOpen, setAddSidebarOpen] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [kanbanTaskSidebarOpen, setKanbanTaskSidebarOpen] = useState(false)
  const [todoTaskSidebarOpen, setTodoTaskSidebarOpen] = useState(false)

  // ** Hooks
  const [isRtl] = useRTL()

  // ** AddEventSidebar Toggle Function
  const handleAddEventSidebar = () => setAddSidebarOpen(!addSidebarOpen)

  // ** LeftSidebar Toggle Function
  const toggleSidebar = val => setLeftSidebarOpen(val)

  // ** Blank Event Object
  const blankEvent = {
    title: '',
    start: '',
    end: '',
    allDay: false,
    url: '',
    extendedProps: {
      calendar: '',
      guests: [],
      location: '',
      description: ''
    }
  }

  // ** refetchEvents
  const refetchEvents = () => {
    if (calendarApi !== null) {
      calendarApi.refetchEvents()
    }
  }

  // ** Opens the real Kanban/Todo Task Details popup (same component those
  // modules render themselves) for the task behind a clicked calendar event,
  // instead of navigating away to /kanban or /todo.
  const handleTaskEventClick = (source, taskId) => {
    if (source === 'kanban') {
      const task = store.kanbanTasks.find(t => t.id === taskId)
      if (!task) return
      dispatch(handleSelectTask(task))
      setKanbanTaskSidebarOpen(true)
    } else {
      const task = store.todoTasks.find(t => t.id === taskId)
      if (!task) return
      dispatch(selectTask(task))
      setTodoTaskSidebarOpen(true)
    }
  }

  // ** Fetch Events On Mount
  useEffect(() => {
    dispatch(fetchEvents(store.selectedCalendars))
    dispatch(fetchKanbanTaskEvents())
    dispatch(fetchTodoTaskEvents())
  }, [])

  return (
    <Fragment>
      <div className='app-calendar overflow-hidden border'>
        <Row className='g-0'>
          <Col
            id='app-calendar-sidebar'
            className={classnames('col app-calendar-sidebar flex-grow-0 overflow-hidden d-flex flex-column', {
              show: leftSidebarOpen
            })}
          >
            <SidebarLeft
              store={store}
              dispatch={dispatch}
              updateFilter={updateFilter}
              toggleSidebar={toggleSidebar}
              updateAllFilters={updateAllFilters}
              toggleTaskFilter={toggleTaskFilter}
              handleAddEventSidebar={handleAddEventSidebar}
            />
          </Col>
          <Col className='position-relative'>
            <Calendar
              isRtl={isRtl}
              store={store}
              dispatch={dispatch}
              blankEvent={blankEvent}
              calendarApi={calendarApi}
              selectEvent={selectEvent}
              updateEvent={updateEvent}
              toggleSidebar={toggleSidebar}
              calendarsColor={calendarsColor}
              setCalendarApi={setCalendarApi}
              handleAddEventSidebar={handleAddEventSidebar}
              handleTaskEventClick={handleTaskEventClick}
            />
          </Col>
          <div
            className={classnames('body-content-overlay', {
              show: leftSidebarOpen === true
            })}
            onClick={() => toggleSidebar(false)}
          ></div>
        </Row>
      </div>
      <AddEventSidebar
        store={store}
        dispatch={dispatch}
        addEvent={addEvent}
        open={addSidebarOpen}
        selectEvent={selectEvent}
        updateEvent={updateEvent}
        removeEvent={removeEvent}
        calendarApi={calendarApi}
        refetchEvents={refetchEvents}
        calendarsColor={calendarsColor}
        handleAddEventSidebar={handleAddEventSidebar}
      />
      <KanbanTaskSidebar
        sidebarOpen={kanbanTaskSidebarOpen}
        selectedTask={kanbanStore.selectedTask}
        handleTaskSidebarToggle={() => setKanbanTaskSidebarOpen(false)}
      />
      <TodoTaskSidebar
        open={todoTaskSidebarOpen}
        handleTaskSidebar={() => setTodoTaskSidebarOpen(false)}
        store={todoStore}
        dispatch={dispatch}
        updateTask={updateTodoTask}
        selectTask={selectTask}
        addTask={addTodoTask}
        deleteTask={deleteTodoTask}
      />
    </Fragment>
  )
}

export default CalendarComponent
