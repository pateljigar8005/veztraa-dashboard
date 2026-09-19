import { useEffect, useState } from 'react'
import axios from 'axios'

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