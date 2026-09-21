import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// MySQL DATETIME wants local wall-clock parts, not a UTC-shifted ISO string
// (same reasoning as the date-only fields elsewhere in this app, see
// CLAUDE.md's Money/currency/dates note) - a plain toISOString() here would
// silently shift an event's time by the browser's UTC offset.
const toMySQLDateTime = date => {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// Normalizes either shape a caller passes in - a plain object built by
// AddEventSidebar's Add/Update handlers, or a real FullCalendar Event
// instance from a drag/resize (Calendar.js's eventDrop/eventResize) - into
// the API's field names. Both shapes expose the same property names
// (title/start/end/allDay/url/extendedProps), just one is a plain object
// and the other a FullCalendar class instance.
const toApiPayload = event => ({
  title: event.title,
  start_at: toMySQLDateTime(event.start),
  end_at: event.end ? toMySQLDateTime(event.end) : null,
  all_day: Boolean(event.allDay),
  url: event.url || null,
  category_id: event.extendedProps?.category_id ?? null,
  location: event.extendedProps?.location ?? null,
  description: event.extendedProps?.description ?? '',
  guests: event.extendedProps?.guests ?? []
})

export const fetchEventCategories = createAsyncThunk('appCalendar/fetchEventCategories', async () => {
  const response = await axios.get('/event-categories/active')
  return response.data.data.eventCategories
})

export const fetchEvents = createAsyncThunk('appCalendar/fetchEvents', async () => {
  const response = await axios.get('/calendar-events')
  return response.data.data
})

export const addEvent = createAsyncThunk('appCalendar/addEvent', async (event, { dispatch }) => {
  const response = await axios.post('/calendar-events', toApiPayload(event))
  await dispatch(fetchEvents())
  return response.data.data
})

export const updateEvent = createAsyncThunk('appCalendar/updateEvent', async (event, { dispatch }) => {
  const response = await axios.put(`/calendar-events/${event.id}`, toApiPayload(event))
  await dispatch(fetchEvents())
  return response.data.data
})

export const removeEvent = createAsyncThunk('appCalendar/removeEvent', async (id, { dispatch }) => {
  try {
    await axios.delete(`/calendar-events/${id}`)
    await dispatch(fetchEvents())
    return id
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete event')
  }
})

export const fetchKanbanTaskEvents = createAsyncThunk('appCalendar/fetchKanbanTaskEvents', async () => {
  const response = await axios.get('/kanban-tasks')
  const tasks = response.data.data.tasks
  const events = tasks
    .filter(task => task.due_date)
    .map(task => ({
      id: `kanban-${task.id}`,
      title: task.title,
      start: task.due_date,
      allDay: true,
      editable: false,
      extendedProps: {
        calendar: 'Kanban Tasks',
        source: 'kanban',
        taskId: task.id,
        // Same value the Kanban board itself uses (low/medium/high/urgent -
        // see kanbanOptions.js's priorityColors) - Calendar.js colors these
        // events by this instead of a single fixed source color.
        priority: task.priority
      }
    }))
  return { events, tasks }
})

export const fetchTodoTaskEvents = createAsyncThunk('appCalendar/fetchTodoTaskEvents', async () => {
  const response = await axios.get('/todos')
  const tasks = response.data.data
  const events = tasks
    .filter(task => task.dueDate && !task.isCompleted && !task.isDeleted)
    .map(task => ({
      id: `todo-${task.id}`,
      title: task.title,
      start: task.dueDate,
      allDay: true,
      editable: false,
      extendedProps: {
        calendar: 'To-Do',
        source: 'todo',
        taskId: task.id,
        // Same low/medium/high/urgent field Kanban tasks use (see
        // fetchKanbanTaskEvents above) - Todo used to have only a
        // free-form `tags` array instead of a real priority column.
        priority: task.priority
      }
    }))
  return { events, tasks }
})

export const appCalendarSlice = createSlice({
  name: 'appCalendar',
  initialState: {
    events: [],
    eventCategories: [],
    kanbanEvents: [],
    kanbanTasks: [],
    todoEvents: [],
    todoTasks: [],
    taskFilters: ['Kanban Tasks', 'To-Do'],
    selectedEvent: {},
    // Category names currently shown - seeded to "all" once categories load
    // (see fetchEventCategories.fulfilled below). Purely a client-side
    // display filter now: the backend already returns exactly this user's
    // own events (or everyone's, for an admin) in one fetch, so toggling a
    // category no longer needs a server round-trip the way the old demo
    // fetchEvents(calendars) faked one.
    selectedCalendars: []
  },
  reducers: {
    selectEvent: (state, action) => {
      state.selectedEvent = action.payload
    },
    toggleTaskFilter: (state, action) => {
      if (state.taskFilters.includes(action.payload)) {
        state.taskFilters = state.taskFilters.filter(name => name !== action.payload)
      } else {
        state.taskFilters.push(action.payload)
      }
    },
    updateFilter: (state, action) => {
      if (state.selectedCalendars.includes(action.payload)) {
        state.selectedCalendars = state.selectedCalendars.filter(name => name !== action.payload)
      } else {
        state.selectedCalendars.push(action.payload)
      }
    },
    updateAllFilters: (state, action) => {
      state.selectedCalendars = action.payload === true ? state.eventCategories.map(c => c.name) : []
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchEventCategories.fulfilled, (state, action) => {
        state.eventCategories = action.payload
        // Default to "all selected" the first time categories load - only
        // when nothing's been chosen yet, so a user's filter picks aren't
        // reset every time this refetches.
        if (state.selectedCalendars.length === 0) {
          state.selectedCalendars = action.payload.map(c => c.name)
        }
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.events = action.payload
      })
      .addCase(fetchKanbanTaskEvents.fulfilled, (state, action) => {
        state.kanbanEvents = action.payload.events
        state.kanbanTasks = action.payload.tasks
      })
      .addCase(fetchTodoTaskEvents.fulfilled, (state, action) => {
        state.todoEvents = action.payload.events
        state.todoTasks = action.payload.tasks
      })
  }
})

export const { selectEvent, toggleTaskFilter, updateFilter, updateAllFilters } = appCalendarSlice.actions

export default appCalendarSlice.reducer
