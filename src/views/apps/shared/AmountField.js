import { useEffect, useRef } from 'react'
import Cleave from 'cleave.js'
import classnames from 'classnames'

const AmountField = ({ id, value, onChange, invalid, className, placeholder, decimalScale = 2, ...rest }) => {
  const inputRef = useRef(null)
  const cleaveRef = useRef(null)
  // Cleave fires onValueChanged for programmatic setRawValue() calls too. Those
  // are just the form loading a saved value into the field, not the user
  // editing it, so they must not reach onChange (it would mark the form dirty).
  const syncingRef = useRef(false)

  useEffect(() => {
    cleaveRef.current = new Cleave(inputRef.current, {
      numeral: true,
      numeralDecimalScale: decimalScale,
      numeralThousandsGroupStyle: 'thousand',
      onValueChanged: e => {
        if (syncingRef.current) return
        onChange(e.target.rawValue)
      }
    })
    return () => cleaveRef.current?.destroy()
  }, [])

  useEffect(() => {
    const current = cleaveRef.current
    if (!current) return
    const next = value === null || value === undefined ? '' : String(value)
    if (current.getRawValue() !== next) {
      syncingRef.current = true
      try {
        current.setRawValue(next)
      } finally {
        syncingRef.current = false
      }
    }
  }, [value])

  return (
    <input
      ref={inputRef}
      id={id}
      placeholder={placeholder}
      className={classnames('form-control', { 'is-invalid': invalid }, className)}
      {...rest}
    />
  )
}

export default AmountField