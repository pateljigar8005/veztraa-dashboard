import { useState, useRef } from 'react'
import { Input } from 'reactstrap'
import Avatar from '@components/avatar'

// Suggests users while typing an @mention in an issue note.
export const MentionTextarea = ({ id, value, onChange, onMention, assigneeOptions, placeholder, rows = 2 }) => {
  const textareaRef = useRef(null)
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionStart, setMentionStart] = useState(null)

  const handleChange = e => {
    const newValue = e.target.value
    const cursor = e.target.selectionStart
    onChange(newValue)

    const uptoCursor = newValue.slice(0, cursor)
    const at = uptoCursor.lastIndexOf('@')
    if (at === -1 || /\s/.test(uptoCursor.slice(at + 1))) {
      setMentionQuery(null)
      setMentionStart(null)
      return
    }
    setMentionQuery(uptoCursor.slice(at + 1))
    setMentionStart(at)
  }

  const filteredOptions =
    mentionQuery !== null
      ? assigneeOptions.filter(o => o.label.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
      : []

  const pickMention = option => {
    const textarea = textareaRef.current
    const cursor = textarea ? textarea.selectionStart : value.length
    const before = value.slice(0, mentionStart)
    const after = value.slice(cursor)
    const inserted = `@${option.label} `
    onChange(before + inserted + after)
    onMention(option.value)
    setMentionQuery(null)
    setMentionStart(null)
    requestAnimationFrame(() => {
      if (!textarea) return
      const pos = before.length + inserted.length
      textarea.focus()
      textarea.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className='position-relative flex-grow-1'>
      <Input
        id={id}
        innerRef={textareaRef}
        type='textarea'
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      {mentionQuery !== null && filteredOptions.length > 0 && (
        <div
          className='mention-suggestions'
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            zIndex: 10,
            width: '100%',
            maxHeight: '10rem',
            overflowY: 'auto',
            background: 'var(--bs-body-bg, #fff)',
            border: '1px solid #d8d6de',
            borderRadius: '0.357rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          {filteredOptions.map(o => (
            <div
              key={o.value}
              className='d-flex align-items-center px-1 py-50'
              style={{ cursor: 'pointer' }}
              onMouseDown={e => {
                // Keep the textarea focused so the mention is inserted at the cursor.
                e.preventDefault()
                pickMention(o)
              }}
            >
              {o.img ? (
                <img className='d-block rounded-circle me-50' src={o.img} height='20' width='20' alt={o.label} />
              ) : (
                <Avatar initials size='sm' className='me-50' color='light-primary' content={o.label} />
              )}
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Highlight only mentions returned by the API.
export const renderCommentText = (text, mentions) => {
  const names = (mentions || []).map(m => m.name).filter(Boolean).sort((a, b) => b.length - a.length)
  if (names.length === 0) {
    return text
  }

  const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`@(${escaped.join('|')})\\b`, 'g')

  const parts = []
  let lastIndex = 0
  let match
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <strong key={match.index} className='text-primary'>
        {match[0]}
      </strong>
    )
    lastIndex = match.index + match[0].length
  }
  parts.push(text.slice(lastIndex))
  return parts
}
