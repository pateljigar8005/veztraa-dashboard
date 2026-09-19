import { useEffect, useRef } from 'react'
import Cleave from 'cleave.js'
import classnames from 'classnames'

const AmountField = ({ id, value, onChange, invalid, className, placeholder, decimalScale = 2, ...rest }) => {
  const inputRef = useRef(null)
  const cleaveRef = useRef(null)

  useEffect(() => {
    cleaveRef.current = new Cleave(inputRef.current, {
      numeral: true,
      numeralDecimalScale: decimalScale,
      numeralThousandsGroupStyle: 'thousand',
      onValueChanged: e => onChange(e.target.rawValue)
    })
    return () => cleaveRef.current?.destroy()
  }, [])

  useEffect(() => {
    const current = cleaveRef.current
    if (!current) return
    const next = value === null || value === undefined ? '' : String(value)
    if (current.getRawValue() !== next) {
      current.setRawValue(next)
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