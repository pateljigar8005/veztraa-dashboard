import { useEffect, useRef } from 'react'
import classnames from 'classnames'
import './otp-input.scss'

// A 6-box (configurable) OTP/code input: one digit per box, auto-advances on
// typing, backspace steps back and clears, arrow keys move focus, and
// pasting a full code (from a password manager or the OS's SMS
// autofill) fills every box at once instead of just the one it landed in.
// `value`/`onChange` deal in a single digits-only string, same shape the
// plain <Input> this replaces already used, so it drops in without the
// caller's own state changing shape. `onComplete` (optional) fires once,
// the moment the value reaches `length`, letting a caller auto-verify
// instead of waiting for a submit click - re-arms if the code is edited
// back down and filled again.
const OtpInput = ({ id, length = 6, value, onChange, onComplete, invalid, disabled, autoFocus }) => {
  const inputsRef = useRef([])
  const firedRef = useRef(false)

  useEffect(() => {
    if (value.length === length) {
      if (!firedRef.current) {
        firedRef.current = true
        onComplete?.(value)
      }
    } else {
      firedRef.current = false
    }
  }, [value])

  const focusInput = index => {
    inputsRef.current[index]?.focus()
  }

  const setDigit = (index, digit) => {
    const chars = value.padEnd(length, ' ').split('')
    chars[index] = digit
    onChange(chars.join('').trimEnd())
  }

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) {
      setDigit(index, '')
      return
    }
    const chars = value.padEnd(length, ' ').split('')
    for (let i = 0; i < raw.length && index + i < length; i++) {
      chars[index + i] = raw[i]
    }
    onChange(chars.join('').trimEnd().slice(0, length))
    focusInput(Math.min(index + raw.length, length - 1))
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (value[index]) {
        setDigit(index, '')
      } else if (index > 0) {
        setDigit(index - 1, '')
        focusInput(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (index, e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '')
    if (!pasted) return
    e.preventDefault()
    const chars = value.padEnd(length, ' ').split('')
    for (let i = 0; i < pasted.length && index + i < length; i++) {
      chars[index + i] = pasted[i]
    }
    onChange(chars.join('').trimEnd().slice(0, length))
    focusInput(Math.min(index + pasted.length, length - 1))
  }

  return (
    <div className={classnames('otp-input d-flex', { 'is-invalid': invalid })} role='group' aria-label='Authentication code'>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={el => (inputsRef.current[index] = el)}
          id={index === 0 ? id : undefined}
          type='text'
          inputMode='numeric'
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          className={classnames('form-control otp-input-box', { 'is-invalid': invalid })}
          value={value[index] || ''}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={e => handleChange(index, e)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={e => handlePaste(index, e)}
          onFocus={e => e.target.select()}
        />
      ))}
    </div>
  )
}

export default OtpInput
