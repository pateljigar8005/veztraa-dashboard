import { Fragment, useState, useEffect } from 'react'
import classnames from 'classnames'
import { Row, Col } from 'reactstrap'
import Calendar from './Calendar'
import SidebarLeft from './SidebarLeft'
import AddEventSidebar from './AddEventSidebar'
import KanbanTaskSidebar from '../kanban/TaskSidebar'
import TodoTaskSidebar from '../todo/TaskSidebar'
import { useRTL } from '@hooks/useRTL'
import useHolidayDates from '@hooks/useHolidayDates'
import useWeekendDays from '@hooks/useWeekendDays'
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
import '@styles/react/apps/app-calendar.scss'

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
  const dispatch = useDispatch()
  const store = useSelector(state => state.calendar)
  const kanbanStore = useSelector(state => state.kanban)
  const todoStore = useSelector(state => state.todo)

  const [calendarApi, setCalendarApi] = useState(null)
  const [addSidebarOpen, setAddSidebarOpen] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [kanbanTaskSidebarOpen, setKanbanTaskSidebarOpen] = useState(false)
  const [todoTaskSidebarOpen, setTodoTaskSidebarOpen] = useState(false)

  const [isRtl] = useRTL()
  const { holidayDates, isHoliday, getHolidayName } = useHolidayDates()
  const { isWeekend } = useWeekendDays()

  const handleAddEventSidebar = () => setAddSidebarOpen(!addSidebarOpen)

  const toggleSidebar = val => setLeftSidebarOpen(val)

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

  const refetchEvents = () => {
    if (calendarApi !== null) {
      calendarApi.refetchEvents()
    }
  }

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
              isHoliday={isHoliday}
              getHolidayName={getHolidayName}
              isWeekend={isWeekend}
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
        holidayDates={holidayDates}
        isHoliday={isHoliday}
        getHolidayName={getHolidayName}
        isWeekend={isWeekend}
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