import { useState } from 'react'
import Select from 'react-select'
import toast from 'react-hot-toast'
import { selectThemeColors } from '@utils'

const isValidEmail = str => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim())

const EmailRecipientsInput = ({ id, value, onChange, placeholder, options = [] }) => {
  const [inputValue, setInputValue] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const selected = (value ? value.split(/[,;]+/) : [])
    .map(v => v.trim())
    .filter(Boolean)
    .map(v => ({ value: v, label: v }))

  const commit = raw => {
    const parts = raw
      .split(/[,;\s]+/)
      .map(p => p.trim())
      .filter(Boolean)
    const valid = parts.filter(isValidEmail)
    const invalid = parts.filter(p => !isValidEmail(p))

    if (invalid.length) {
      toast.error(invalid.length === 1 ? `"${invalid[0]}" isn't a valid email address` : `${invalid.length} entries aren't valid email addresses`)
    }
    if (!valid.length) return false

    const merged = [...selected.map(o => o.value), ...valid]
    onChange(Array.from(new Set(merged)).join(','))
    return true
  }

  const handleKeyDown = e => {
    const hasMatchingOption =
      menuOpen &&
      inputValue.trim() &&
      availableOptions.some(o => o.label.toLowerCase().includes(inputValue.trim().toLowerCase()))
    if (hasMatchingOption && (e.key === 'Enter' || e.key === 'Tab')) return
    if ((e.key === 'Enter' || e.key === 'Tab' || e.key === ',') && inputValue.trim()) {
      e.preventDefault()
      if (commit(inputValue)) setInputValue('')
    }
  }

  const handlePaste = e => {
    const text = e.clipboardData.getData('text')
    if (/[,;\s]/.test(text.trim())) {
      e.preventDefault()
      if (commit(text)) setInputValue('')
    }
  }

  const handleBlur = () => {
    if (inputValue.trim() && commit(inputValue)) setInputValue('')
  }

  const selectedValues = new Set(selected.map(o => o.value.toLowerCase()))
  const availableOptions = options.filter(o => !selectedValues.has(o.value.toLowerCase()))

  return (
    <Select
      inputId={id}
      isMulti
      options={availableOptions}
      components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
      className='react-select flex-grow-1'
      classNamePrefix='select'
      theme={selectThemeColors}
      styles={{
        control: base => ({ ...base, border: 'none', boxShadow: 'none', backgroundColor: 'transparent' }),
        menuPortal: base => ({ ...base, zIndex: 9999 })
      }}
      menuPortalTarget={document.body}
      placeholder={placeholder}
      value={selected}
      inputValue={inputValue}
      onInputChange={(val, actionMeta) => {
        if (actionMeta.action === 'input-change') setInputValue(val)
      }}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onBlur={handleBlur}
      onChange={opts => {
        onChange((opts || []).map(o => o.value).join(','))
        setInputValue('')
      }}
    />
  )
}

export default EmailRecipientsInput