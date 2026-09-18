// ** React Import
import { useEffect, useRef, memo } from 'react'

// ** Full Calendar & it's Plugins
import '@fullcalendar/react/dist/vdom'
import FullCalendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

// ** Third Party Components
import toast from 'react-hot-toast'
import { Menu } from 'react-feather'
import { Card, CardBody } from 'reactstrap'

// ** Utils
import { toDateOnly } from '@utils'

const Calendar = props => {
  // ** Refs
  const calendarRef = useRef(null)

  // ** Props
  const {
    store,
    isRtl,
    dispatch,
    calendarsColor,
    calendarApi,
    setCalendarApi,
    handleAddEventSidebar,
    blankEvent,
    toggleSidebar,
    selectEvent,
    updateEvent,
    handleTaskEventClick,
    isHoliday,
    getHolidayName,
    isWeekend
  } = props

  // ** UseEffect checks for CalendarAPI Update
  useEffect(() => {
    if (calendarApi === null) {
      setCalendarApi(calendarRef.current.getApi())
    }
  }, [calendarApi])

  // ** Shared by dateClick/eventDrop/eventResize below - a single place
  // deciding whether a date is blocked (a holiday or a configured weekend
  // day), so dragging/resizing an EXISTING event onto one of these dates
  // is rejected the same way clicking to CREATE a new one there already
  // was. Returns a toast message, or null if the date is fine.
  const holidayBlockReason = date => {
    const holidayName = getHolidayName(toDateOnly(date))
    if (holidayName) return `${holidayName} - no events can be added on a holiday`
    if (isWeekend(date)) return 'Weekend - no events can be added on this date'
    return null
  }

  // ** Kanban/Todo due-date events, filterable via the sidebar's Tasks section
  const taskEvents = [
    ...(store.taskFilters.includes('Kanban Tasks') ? store.kanbanEvents : []),
    ...(store.taskFilters.includes('To-Do') ? store.todoEvents : [])
  ]

  // ** calendarOptions(Props)
  const calendarOptions = {
    events: [...(store.events.length ? store.events : []), ...taskEvents],
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      start: 'sidebarToggle, prev,next, title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    /*
      Enable dragging and resizing event
      ? Docs: https://fullcalendar.io/docs/editable
    */
    editable: true,

    /*
      Enable resizing event from start
      ? Docs: https://fullcalendar.io/docs/eventResizableFromStart
    */
    eventResizableFromStart: true,

    /*
      Automatically scroll the scroll-containers during event drag-and-drop and date selecting
      ? Docs: https://fullcalendar.io/docs/dragScroll
    */
    dragScroll: true,

    /*
      Max number of events within a given day
      ? Docs: https://fullcalendar.io/docs/dayMaxEvents
    */
    dayMaxEvents: 2,

    /*
      Determines if day names and week names are clickable
      ? Docs: https://fullcalendar.io/docs/navLinks
    */
    navLinks: true,

    // ** Company-wide holidays and weekend days (see the Holidays and
    // Company Settings modules) - greyed out and non-clickable, same idea
    // as a real calendar's non-working days.
    dayCellClassNames({ date }) {
      return isHoliday(toDateOnly(date)) || isWeekend(date) ? ['fc-day-holiday'] : []
    },

    eventClassNames({ event: calendarEvent }) {
      // eslint-disable-next-line no-underscore-dangle
      const colorName = calendarsColor[calendarEvent._def.extendedProps.calendar]

      return [
        // Background Color
        `bg-light-${colorName}`
      ]
    },

    eventClick({ event: clickedEvent }) {
      // eslint-disable-next-line no-underscore-dangle
      const source = clickedEvent._def.extendedProps.source
      if (source === 'kanban' || source === 'todo') {
        handleTaskEventClick(source, clickedEvent._def.extendedProps.taskId)
        return
      }

      dispatch(selectEvent(clickedEvent))
      handleAddEventSidebar()

      // * Only grab required field otherwise it goes in infinity loop
      // ! Always grab all fields rendered by form (even if it get `undefined`) otherwise due to Vue3/Composition API you might get: "object is not extensible"
      // event.value = grabEventDataFromEventApi(clickedEvent)

      // eslint-disable-next-line no-use-before-define
      // isAddNewEventSidebarActive.value = true
    },

    customButtons: {
      sidebarToggle: {
        text: <Menu className='d-xl-none d-block' />,
        click() {
          toggleSidebar(true)
        }
      }
    },

    dateClick(info) {
      const reason = holidayBlockReason(info.date)
      if (reason) {
        toast.error(reason)
        return
      }
      const ev = blankEvent
      ev.start = info.date
      ev.end = info.date
      dispatch(selectEvent(ev))
      handleAddEventSidebar()
    },

    /*
      Handle event drop (Also include dragged event)
      ? Docs: https://fullcalendar.io/docs/eventDrop
      ? We can use `eventDragStop` but it doesn't return updated event so we have to use `eventDrop` which returns updated event
      ! Dragging an EXISTING event onto a holiday/weekend was a real gap -
      ! dateClick above blocked only CREATING a new one there, this never
      ! checked at all, so an event could be dragged straight onto a
      ! blocked date. revert() is FullCalendar's own built-in undo for a
      ! rejected drag, snapping the event back to where it started.
    */
    eventDrop({ event: droppedEvent, revert }) {
      const reason = holidayBlockReason(droppedEvent.start)
      if (reason) {
        toast.error(reason)
        revert()
        return
      }
      dispatch(updateEvent(droppedEvent))
      toast.success('Event Updated')
    },

    /*
      Handle event resize
      ? Docs: https://fullcalendar.io/docs/eventResize
      ! Same gap as eventDrop above - resizing (which, with
      ! eventResizableFromStart, can move either edge) onto a blocked date
      ! went unchecked too. Checks both edges since either one can move.
    */
    eventResize({ event: resizedEvent, revert }) {
      const reason = holidayBlockReason(resizedEvent.start) || (resizedEvent.end && holidayBlockReason(resizedEvent.end))
      if (reason) {
        toast.error(reason)
        revert()
        return
      }
      dispatch(updateEvent(resizedEvent))
      toast.success('Event Updated')
    },

    ref: calendarRef,

    // Get direction from app state (store)
    direction: isRtl ? 'rtl' : 'ltr'
  }

  return (
    <Card className='shadow-none border-0 mb-0 rounded-0'>
      <CardBody className='pb-0'>
        <FullCalendar {...calendarOptions} />{' '}
      </CardBody>
    </Card>
  )
}

export default memo(Calendar)
