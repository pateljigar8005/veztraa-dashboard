import { useEffect, useState } from 'react'
import axios from 'axios'

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