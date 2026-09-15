// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const fetchEvents = createAsyncThunk('appCalendar/fetchEvents', async calendars => {
  const response = await axios.get('/apps/calendar/events', { calendars })
  return response.data
})

export const addEvent = createAsyncThunk('appCalendar/addEvent', async (event, { dispatch, getState }) => {
  await axios.post('/apps/calendar/add-event', { event })
  await dispatch(fetchEvents(getState().calendar.selectedCalendars))
  return event
})

export const updateEvent = createAsyncThunk('appCalendar/updateEvent', async (event, { dispatch, getState }) => {
  await axios.post('/apps/calendar/update-event', { event })
  await dispatch(fetchEvents(getState().calendar.selectedCalendars))
  return event
})

export const updateFilter = createAsyncThunk('appCalendar/updateFilter', async (filter, { dispatch, getState }) => {
  if (getState().calendar.selectedCalendars.includes(filter)) {
    await dispatch(fetchEvents(getState().calendar.selectedCalendars.filter(i => i !== filter)))
  } else {
    await dispatch(fetchEvents([...getState().calendar.selectedCalendars, filter]))
  }
  return filter
})

export const updateAllFilters = createAsyncThunk('appCalendar/updateAllFilters', async (value, { dispatch }) => {
  if (value === true) {
    await dispatch(fetchEvents(['Personal', 'Business', 'Family', 'Holiday', 'ETC']))
  } else {
    await dispatch(fetchEvents([]))
  }
  return value
})

export const removeEvent = createAsyncThunk('appCalendar/removeEvent', async id => {
  await axios.delete('/apps/calendar/remove-event', { id })
  return id
})

// Read-only overlay events sourced from the real Kanban/Todo modules, so
// upcoming due dates show up here without duplicating them into a real
// calendar_events table - see [[kanban]]/[[todo]] due_date fields, the
// actual source of truth. Only tasks that actually have a due date are
// included; a task's own edit form (not this calendar) is still where its
// due date gets changed, so these events are marked non-editable/non-draggable.
export const fetchKanbanTaskEvents = createAsyncThunk('appCalendar/fetchKanbanTaskEvents', async () => {
  const response = await axios.get('/kanban-tasks')
  return response.data.data.tasks
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
        taskId: task.id
      }
    }))
})

export const fetchTodoTaskEvents = createAsyncThunk('appCalendar/fetchTodoTaskEvents', async () => {
  const response = await axios.get('/todos')
  return response.data.data
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
        taskId: task.id
      }
    }))
})

export const appCalendarSlice = createSlice({
  name: 'appCalendar',
  initialState: {
    events: [],
    kanbanEvents: [],
    todoEvents: [],
    taskFilters: ['Kanban Tasks', 'To-Do'],
    selectedEvent: {},
    selectedCalendars: ['Personal', 'Business', 'Family', 'Holiday', 'ETC']
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
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.events = action.payload
      })
      .addCase(fetchKanbanTaskEvents.fulfilled, (state, action) => {
        state.kanbanEvents = action.payload
      })
      .addCase(fetchTodoTaskEvents.fulfilled, (state, action) => {
        state.todoEvents = action.payload
      })
      .addCase(updateFilter.fulfilled, (state, action) => {
        if (state.selectedCalendars.includes(action.payload)) {
          state.selectedCalendars.splice(state.selectedCalendars.indexOf(action.payload), 1)
        } else {
          state.selectedCalendars.push(action.payload)
        }
      })
      .addCase(updateAllFilters.fulfilled, (state, action) => {
        const value = action.payload
        let selected = []
        if (value === true) {
          selected = ['Personal', 'Business', 'Family', 'Holiday', 'ETC']
        } else {
          selected = []
        }
        state.selectedCalendars = selected
      })
  }
})

export const { selectEvent, toggleTaskFilter } = appCalendarSlice.actions

export default appCalendarSlice.reducer
