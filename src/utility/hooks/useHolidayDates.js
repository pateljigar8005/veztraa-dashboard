import { useEffect, useState } from 'react'
import axios from 'axios'

// ** Company-wide holidays (see the Holidays settings module) - fetched once
// per mount by every place that needs to block or grey out those dates
// (Todo/Kanban due-date pickers, the Calendar), same "fetch fresh per
// component mount" convention as this app's other lightweight option lists
// (see e.g. ComposePopup's own contactOptions/templateOptions fetches)
// rather than a global cache, so a holiday added on another tab shows up
// here the next time one of these components mounts.
const useHolidayDates = () => {
  const [holidays, setHolidays] = useState([])

  useEffect(() => {
    axios
      .get('/holidays/all')
      .then(response => setHolidays(response.data?.data?.holidays || []))
      .catch(() => {})
  }, [])

  const holidayDates = holidays.map(h => h.date)
  const isHoliday = date => holidays.some(h => h.date === date)
  const getHolidayName = date => holidays.find(h => h.date === date)?.name || null

  return { holidays, holidayDates, isHoliday, getHolidayName }
}

export default useHolidayDates
