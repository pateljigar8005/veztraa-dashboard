import { useEffect, useRef, memo } from 'react'
import '@fullcalendar/react/dist/vdom'
import FullCalendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import toast from 'react-hot-toast'
import { Menu } from 'react-feather'
import { Card, CardBody } from 'reactstrap'
import { toDateOnly } from '@utils'
import { priorityColors } from '../todo/todoOptions'

const Calendar = props => {
  const calendarRef = useRef(null)

  const {
    store,
    isRtl,
    dispatch,
    calendarsColor,
    calendarApi,
    setCalendarApi,
    handleAddEventSidebar,
    toggleSidebar,
    selectEvent,
    updateEvent,
    handleTaskEventClick,
    isHoliday,
    getHolidayName,
    isWeekend
  } = props

  useEffect(() => {
    if (calendarApi === null) {
      setCalendarApi(calendarRef.current.getApi())
    }
  }, [calendarApi])

  const holidayBlockReason = date => {
    const holidayName = getHolidayName(toDateOnly(date))
    if (holidayName) return `${holidayName} - no events can be added on a holiday`
    if (isWeekend(date)) return 'Weekend - no events can be added on this date'
    return null
  }

  const taskEvents = store.taskFilters.includes('To-Do') ? store.todoEvents : []

  // An event with no category (extendedProps.calendar null/undefined) is
  // never filterable - selectedCalendars only ever holds real category
  // names, so a null-category event could never match it and would
  // otherwise vanish regardless of "View All" state.
  const filteredEvents = store.events
    .filter(event => !event.extendedProps?.calendar || store.selectedCalendars.includes(event.extendedProps.calendar))
    // The API returns url: null for an event with none (a real, correct
    // JSON null) - FullCalendar renders the event as a clickable <a> the
    // moment a `url` key is present at all, and string-interpolates a
    // literal null straight into its href instead of treating it the same
    // as "no url", so clicking one navigated to `${origin}/null`. Dropping
    // the key entirely when it's not a real URL avoids that path -
    // Todo-sourced events never had this bug because they never set a url
    // key in the first place (see fetchTodoTaskEvents in store/index.js).
    .map(event => {
      if (event.url) return event
      const { url, ...rest } = event
      return rest
    })

  const calendarOptions = {
    events: [...filteredEvents, ...taskEvents],
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      start: 'sidebarToggle, prev,next, title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    editable: true,

    eventResizableFromStart: true,

    dragScroll: true,

    dayMaxEvents: 2,

    // Uniform week-row height is enforced via CSS instead (see
    // .fc-daygrid-day-frame in app-calendar.scss) - a fixed height here
    // isn't enough on its own (FullCalendar's own row-balancing still
    // stretches whichever row needs a "+more" link), and worse, would clip
    // a 6-week month's rows into a fixed total sized for 5. Leaving this
    // at the default 'auto' lets the container grow to fit however many
    // (now uniformly-sized) rows the current month actually needs.

    navLinks: true,

    dayCellClassNames({ date }) {
      return isHoliday(toDateOnly(date)) || isWeekend(date) ? ['fc-day-holiday'] : []
    },

    eventClassNames({ event: calendarEvent }) {
      const { calendar, source, priority } = calendarEvent._def.extendedProps

      // Todo tiles color by the task's own priority (low/medium/high/urgent,
      // see todoOptions.js) instead of one fixed color per source, so a
      // glance at the calendar shows what's actually urgent. Every other
      // event (Meeting/Deadline/etc.) keeps its admin-managed category
      // color.
      const colorName = source === 'todo' ? priorityColors[priority] || 'secondary' : calendarsColor[calendar]

      return [
        `bg-light-${colorName}`
      ]
    },

    eventClick({ event: clickedEvent }) {
      // Clicking an event from inside a day cell's "+N more" popover opens
      // our own sidebar/modal on top, but FullCalendar's own popover (a
      // separate overlay it manages itself) doesn't know that happened and
      // stays open behind/over it - closing it the same way its own X
      // button would is the only way to dismiss it (there's no public API
      // method for this). A no-op when the event wasn't opened from that
      // popover in the first place, since the selector just won't match.
      document.querySelector('.fc-popover-close')?.click()

      if (clickedEvent._def.extendedProps.source === 'todo') {
        handleTaskEventClick(clickedEvent._def.extendedProps.taskId)
        return
      }

      // A plain object, not the raw FullCalendar EventApi instance - Redux
      // state should only ever hold serializable data (Redux Toolkit's own
      // serializableCheck middleware flags class instances like this one),
      // and AddEventSidebar's delete/update flows only ever read these
      // same plain fields back off selectedEvent anyway.
      dispatch(
        selectEvent({
          id: clickedEvent.id,
          title: clickedEvent.title,
          start: clickedEvent.start,
          end: clickedEvent.end,
          allDay: clickedEvent.allDay,
          url: clickedEvent.url,
          extendedProps: clickedEvent.extendedProps
        })
      )
      handleAddEventSidebar()


    },

    customButtons: {
      sidebarToggle: {
        text: <Menu className='d-xl-none d-block' />,
        click() {
          toggleSidebar(true)
        }
      }
    },

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