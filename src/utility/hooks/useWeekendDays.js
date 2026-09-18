import { useEffect, useState } from 'react'
import axios from 'axios'

// ** Which day(s) count as a weekend, company-wide (see Company Settings'
// own "Weekend Days" toggles) - same "fetch fresh per mount" convention as
// useHolidayDates, which this is meant to be used alongside (see Todo/Kanban
// TaskSidebar and the Calendar, all of which block BOTH holidays and
// configured weekend days from being picked/added to, the same way).
const useWeekendDays = () => {
  const [weekendSaturday, setWeekendSaturday] = useState(false)
  const [weekendSunday, setWeekendSunday] = useState(false)

  useEffect(() => {
    axios
      .get('/company')
      .then(response => {
        setWeekendSaturday(response.data?.data?.weekend_saturday !== false)
        setWeekendSunday(response.data?.data?.weekend_sunday !== false)
      })
      .catch(() => {})
  }, [])

  // Date.getDay(): 0 = Sunday ... 6 = Saturday. Accepts either a real Date
  // (e.g. Flatpickr's own disable-function callback, or FullCalendar's
  // dayCellClassNames) or a plain 'YYYY-MM-DD' string - built from its own
  // Y/M/D parts rather than `new Date(str)`, which parses as UTC and can
  // shift the weekday depending on the browser's local timezone (same
  // pitfall called out elsewhere in this app's own date handling).
  const isWeekend = dateOrString => {
    let date = dateOrString
    if (typeof dateOrString === 'string') {
      const [y, m, d] = dateOrString.split('-').map(Number)
      date = new Date(y, m - 1, d)
    }
    const day = date.getDay()
    return (day === 6 && weekendSaturday) || (day === 0 && weekendSunday)
  }

  return { weekendSaturday, weekendSunday, isWeekend }
}

export default useWeekendDays
