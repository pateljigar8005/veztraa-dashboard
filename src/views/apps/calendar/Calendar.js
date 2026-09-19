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
    blankEvent,
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

  const taskEvents = [
    ...(store.taskFilters.includes('Kanban Tasks') ? store.kanbanEvents : []),
    ...(store.taskFilters.includes('To-Do') ? store.todoEvents : [])
  ]

  const calendarOptions = {
    events: [...(store.events.length ? store.events : []), ...taskEvents],
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

    navLinks: true,

    dayCellClassNames({ date }) {
      return isHoliday(toDateOnly(date)) || isWeekend(date) ? ['fc-day-holiday'] : []
    },

    eventClassNames({ event: calendarEvent }) {
      const colorName = calendarsColor[calendarEvent._def.extendedProps.calendar]

      return [
        `bg-light-${colorName}`
      ]
    },

    eventClick({ event: clickedEvent }) {
      const source = clickedEvent._def.extendedProps.source
      if (source === 'kanban' || source === 'todo') {
        handleTaskEventClick(source, clickedEvent._def.extendedProps.taskId)
        return
      }

      dispatch(selectEvent(clickedEvent))
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