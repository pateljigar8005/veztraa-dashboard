// ** React Imports
import { useState } from 'react'

// ** Third Party Components
import Select from 'react-select'
import toast from 'react-hot-toast'

// ** Utils
import { selectThemeColors } from '@utils'

const isValidEmail = str => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim())

// A free-text, multi-value "chip" input for To/Cc/Bcc - type an address and
// press Enter/Tab/comma (or paste a comma/semicolon/space-separated list) to
// turn it into a removable tag, matching how Gmail's own recipient fields
// work. Built on the same react-select already used everywhere else in this
// app rather than a new dependency, just with no dropdown/options list -
// it's used purely for its multi-value chip UI plus free-text entry.
const EmailRecipientsInput = ({ id, value, onChange, placeholder, options = [] }) => {
  const [inputValue, setInputValue] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  // The rest of the compose form (and the backend) works with a single
  // comma-separated string, so that stays the source of truth here too -
  // only converted to {value,label} options for react-select's own sake.
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
    // Only defer to react-select's own Enter/Tab (pick the highlighted
    // suggestion) when there's an actual suggestion matching what's typed -
    // the menu can be "open" while showing nothing but a "No options"
    // message, and that shouldn't swallow the keystroke that would otherwise
    // commit free-typed text (an address not in the contacts list) as a chip.
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

  // Existing chips shouldn't also show up as pickable suggestions.
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
        // The row itself (.compose-mail-form-field) already draws a
        // border-bottom for visual separation - react-select's own control
        // border is a nested internal element, so a plain border-0 class on
        // the outer wrapper never reaches it. Removing it here instead.
        control: base => ({ ...base, border: 'none', boxShadow: 'none', backgroundColor: 'transparent' }),
        // Rendered inline, the suggestions menu sits underneath the rich-text
        // editor below it (a later, higher stacking context) - portaling it
        // to <body> escapes that entirely instead of fighting z-index.
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
      onChange={opts => onChange((opts || []).map(o => o.value).join(','))}
    />
  )
}

export default EmailRecipientsInput
