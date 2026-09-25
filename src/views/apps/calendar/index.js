import { Fragment, useState, useEffect } from 'react'
import classnames from 'classnames'
import { useNavigate } from 'react-router-dom'
import { Row, Col } from 'reactstrap'
import Calendar from './Calendar'
import SidebarLeft from './SidebarLeft'
import AddEventSidebar from './AddEventSidebar'
import { useRTL } from '@hooks/useRTL'
import useHolidayDates from '@hooks/useHolidayDates'
import useWeekendDays from '@hooks/useWeekendDays'
import { useSelector, useDispatch } from 'react-redux'
import {
  fetchEvents,
  fetchEventCategories,
  fetchTodoTaskEvents,
  selectEvent,
  updateEvent,
  updateFilter,
  updateAllFilters,
  toggleTaskFilter,
  addEvent,
  removeEvent
} from './store'
import '@styles/react/apps/app-calendar.scss'

const CalendarComponent = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const store = useSelector(state => state.calendar)

  // Todo tiles color by task priority instead (see Calendar.js's
  // eventClassNames + todoOptions.js's priorityColors) - this only needs
  // to cover real, admin-managed event_categories rows.
  const calendarsColor = Object.fromEntries(store.eventCategories.map(c => [c.name, c.color]))

  const [calendarApi, setCalendarApi] = useState(null)
  const [addSidebarOpen, setAddSidebarOpen] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)

  const [isRtl] = useRTL()
  const { holidayDates, isHoliday, getHolidayName } = useHolidayDates()
  const { isWeekend } = useWeekendDays()

  const handleAddEventSidebar = () => setAddSidebarOpen(!addSidebarOpen)

  const toggleSidebar = val => setLeftSidebarOpen(val)

  const refetchEvents = () => {
    if (calendarApi !== null) {
      calendarApi.refetchEvents()
    }
  }

  // Only Todo events are clickable task tiles now - the only source left
  // after Kanban's removal. Redirects to the Todo page's own `?task=` deep
  // link (already used by the notification bell's mention/overdue items -
  // see NotificationController.php) instead of opening a second, local copy
  // of TaskSidebar in place - one real task view, not two independent mounts
  // of the same component that could drift out of sync with each other.
  const handleTaskEventClick = taskId => {
    navigate(`/todo?task=${taskId}`)
  }

  useEffect(() => {
    dispatch(fetchEventCategories())
    dispatch(fetchEvents())
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
    </Fragment>
  )
}

export default CalendarComponent
