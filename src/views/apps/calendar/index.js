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
  fetchInvoiceDueEvents,
  fetchExpenseEvents,
  fetchContractInvoiceEvents,
  selectEvent,
  updateEvent,
  updateFilter,
  updateAllFilters,
  toggleTaskFilter,
  addEvent,
  removeEvent
} from './store'
import { currentUserCan } from '@src/utility/navPermissions'
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

  const handleInvoiceEventClick = invoiceId => {
    navigate(`/invoice/view/${invoiceId}`)
  }

  const handleExpenseEventClick = expenseId => {
    navigate(`/expense/edit/${expenseId}`)
  }

  const handleContractEventClick = contractId => {
    navigate(`/contract/view/${contractId}`)
  }

  useEffect(() => {
    dispatch(fetchEventCategories())
    dispatch(fetchEvents())
    dispatch(fetchTodoTaskEvents())
    dispatch(fetchInvoiceDueEvents())
    // Same permission that gates the Contracts list itself - not every
    // user should see projected contract invoice dates on their calendar.
    if (currentUserCan('/contract', 'view')) {
      dispatch(fetchContractInvoiceEvents())
    }
    if (currentUserCan('/expense', 'view')) {
      dispatch(fetchExpenseEvents())
    }
  }, [])

  // Holidays load asynchronously (useHolidayDates fetches after mount), but
  // dayCellDidMount (which paints the holiday label/highlight) is a real
  // React componentDidMount under the hood - FullCalendar reuses and updates
  // its existing day-cell elements rather than remounting them, whether
  // re-rendered in place, sent through changeView() back to the same date,
  // or paged a month away and back with next()/prev() - confirmed against
  // this exact FullCalendar version in isolation, none of those make
  // dayCellDidMount fire again for a cell that's already mounted. Forcing a
  // real unmount+remount of the whole FullCalendar instance (via the `key`
  // passed to it in Calendar.js) is the only thing that does. Bumping this
  // once holidays actually load is what the manual "switch month and back"
  // workaround was really doing - the navigation itself was incidental, the
  // fix was the remount a route/visibility change happens to cause elsewhere.
  const [calendarRemountKey, setCalendarRemountKey] = useState(0)
  useEffect(() => {
    if (holidayDates.length > 0) {
      setCalendarRemountKey(key => key + 1)
    }
  }, [holidayDates.length])

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
              handleInvoiceEventClick={handleInvoiceEventClick}
              handleExpenseEventClick={handleExpenseEventClick}
              handleContractEventClick={handleContractEventClick}
              calendarRemountKey={calendarRemountKey}
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
