import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { formatAmount } from '@utils'

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

export const fetchTodoTaskEvents = createAsyncThunk('appCalendar/fetchTodoTaskEvents', async () => {
  // Only unfinished issues with a due date belong on the calendar.
  const response = await axios.get('/todos', { params: { perPage: 500, has_due_date: 1, hide_done: 1, sortColumn: 'due_date', sortDirection: 'asc' } })
  const tasks = response.data.data.issues
  const events = tasks.map(task => ({
    id: `todo-${task.id}`,
    title: task.title,
    start: task.due_date,
    allDay: true,
    editable: false,
    extendedProps: {
      calendar: 'Tasks',
      source: 'todo',
      taskId: task.id,
      priority: task.priority
    }
  }))
  return { events, tasks }
})

// Two events per projected occurrence - when the contract's next invoice
// will be generated (by the recurring-invoice cron) and the projected due
// date that invoice will get - so collections can be planned before either
// actually exists yet.
export const fetchContractInvoiceEvents = createAsyncThunk('appCalendar/fetchContractInvoiceEvents', async () => {
  const response = await axios.get('/contracts/upcoming-invoices')
  const occurrences = response.data.data.occurrences
  const events = occurrences.flatMap(occ => {
    const label = occ.company_name || occ.contact_name || occ.client_full_name || `Contract ${occ.contract_number}`
    return [
      {
        id: `contract-invoice-${occ.contract_id}-${occ.invoice_date}`,
        title: `Invoice to generate - ${label}`,
        start: occ.invoice_date,
        allDay: true,
        editable: false,
        extendedProps: {
          calendar: 'Upcoming Invoices',
          source: 'contract-invoice',
          contractId: occ.contract_id
        }
      },
      {
        id: `contract-invoice-due-${occ.contract_id}-${occ.due_date}`,
        title: `Invoice due (projected) - ${label}`,
        start: occ.due_date,
        allDay: true,
        editable: false,
        extendedProps: {
          calendar: 'Upcoming Invoices',
          source: 'contract-invoice-due',
          contractId: occ.contract_id
        }
      }
    ]
  })
  return { events }
})

// Upcoming recurring expenses (subscriptions, EMIs, monthly bills) due in
// the next 30 days - a payment-reminder view. Expenses that already exist
// (i.e. are paid/recorded) aren't shown. Clicking one opens the recurring
// expense it comes from.
const UPCOMING_EXPENSE_DAYS = 30

export const fetchExpenseEvents = createAsyncThunk('appCalendar/fetchExpenseEvents', async () => {
  const response = await axios.get('/expenses/upcoming', { params: { days: UPCOMING_EXPENSE_DAYS } })
  // The API already limits this to `days`; the same cutoff here keeps the
  // calendar right even against an older API that ignores the parameter.
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + UPCOMING_EXPENSE_DAYS)
  const until = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`

  const events = response.data.data.occurrences.filter(occ => occ.date <= until).map(occ => ({
    id: `expense-upcoming-${occ.template_id}-${occ.date}`,
    title: `Due: ${occ.category}${occ.vendor_name ? ` - ${occ.vendor_name}` : ''} (${occ.currency}${formatAmount(occ.amount)})`,
    start: occ.date,
    allDay: true,
    editable: false,
    extendedProps: { calendar: 'Expenses', source: 'expense-upcoming', expenseId: occ.template_id }
  }))

  return { events }
})

export const appCalendarSlice = createSlice({
  name: 'appCalendar',
  initialState: {
    events: [],
    eventCategories: [],
    // False until the first category fetch settles - the sidebar shows a
    // skeleton instead of the filter list until then.
    categoriesLoaded: false,
    todoEvents: [],
    todoTasks: [],
    contractInvoiceEvents: [],
    expenseEvents: [],
    taskFilters: ['Tasks', 'Upcoming Invoices', 'Expenses'],
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
      .addCase(fetchEventCategories.rejected, state => {
        state.categoriesLoaded = true
      })
      .addCase(fetchEventCategories.fulfilled, (state, action) => {
        state.categoriesLoaded = true
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
      .addCase(fetchTodoTaskEvents.fulfilled, (state, action) => {
        state.todoEvents = action.payload.events
        state.todoTasks = action.payload.tasks
      })
      .addCase(fetchContractInvoiceEvents.fulfilled, (state, action) => {
        state.contractInvoiceEvents = action.payload.events
      })
      .addCase(fetchExpenseEvents.fulfilled, (state, action) => {
        state.expenseEvents = action.payload.events
      })
  }
})

export const { selectEvent, toggleTaskFilter, updateFilter, updateAllFilters } = appCalendarSlice.actions

export default appCalendarSlice.reducer
