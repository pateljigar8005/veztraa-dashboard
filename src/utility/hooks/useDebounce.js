import { useEffect, useState } from 'react'

// ** Returns a copy of `value` that only updates after it stops changing for
// `delay` ms - used to hold off firing a server search request until the
// user pauses typing, instead of on every keystroke.
const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
