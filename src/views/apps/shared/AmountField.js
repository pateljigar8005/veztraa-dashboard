// ** React Imports
import { useEffect, useRef } from 'react'

// ** Third Party Components
import Cleave from 'cleave.js'
import classnames from 'classnames'

// Thin wrapper around cleave.js (already a dependency, just missing a React
// binding) - gives every money field the same thousand-separated, 2-decimal
// masked display (e.g. typing 1500000 shows as 1,500,000) instead of a raw
// <input type='number'>. `value`/`onChange` both work with plain numeric
// strings ('1500000.5'), the same format every amount field already
// stores/sends, so nothing downstream (totals math, payload Number(...)
// casts) needs to change.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep cleave in sync when `value` changes from outside typing (e.g.
  // reset() populating an Edit form) - skipped when it already matches so a
  // normal keystroke's own onValueChanged round-trip never fights the cursor.
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
