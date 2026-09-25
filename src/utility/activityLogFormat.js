import { formatDate } from '@utils'

// Shared formatting for activity-log list and record-history views.

// Stored slugs are converted only for display.
export const formatEntityType = value =>
  (value || '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

// Format dotted permission keys such as "todo.add" as "Todo → Add".
export const formatFieldName = field =>
  field
    .split('.')
    .map(formatEntityType)
    .join(' → ')

const MAX_VALUE_LENGTH = 160
const truncate = text => (text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text)

// Convert decoded JSON values into readable, bounded text.
export const formatValue = value => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    return truncate(
      value
        .map(item => {
          if (item && typeof item === 'object') {
            const label = item.name || item.title || item.description || 'Item'
            const qty = item.qty ?? item.quantity
            const rate = item.rate ?? item.price
            return qty !== undefined && rate !== undefined ? `${label} (${qty} × ${rate})` : label
          }
          return String(item)
        })
        .join('; ')
    )
  }

  if (typeof value === 'object') {
    return truncate(
      Object.entries(value)
        .map(([key, val]) => `${formatEntityType(key)}: ${formatValue(val)}`)
        .join(', ')
    )
  }

  return truncate(String(value))
}

const lineItemLabel = item => item?.description || item?.name || 'Line item'

// Show useful quantity and amount changes without dumping full line items.
export const describeLineItemsChange = (from, to) => {
  const fromItems = Array.isArray(from) ? from : []
  const toItems = Array.isArray(to) ? to : []
  const lines = []

  for (let i = 0; i < Math.max(fromItems.length, toItems.length); i++) {
    const oldItem = fromItems[i]
    const newItem = toItems[i]

    if (!oldItem && newItem) {
      lines.push(`Line item added: ${lineItemLabel(newItem)}`)
      continue
    }
    if (oldItem && !newItem) {
      lines.push(`Line item removed: ${lineItemLabel(oldItem)}`)
      continue
    }
    if (!oldItem || !newItem) continue

    const fieldChanges = []
    if (String(oldItem.qty ?? '') !== String(newItem.qty ?? '')) {
      fieldChanges.push(`Quantity: ${formatValue(oldItem.qty)} → ${formatValue(newItem.qty)}`)
    }
    if (String(oldItem.rate ?? '') !== String(newItem.rate ?? '')) {
      fieldChanges.push(`Amount: ${formatValue(oldItem.rate)} → ${formatValue(newItem.rate)}`)
    }

    // Keep each field change on its own line for readability.
    if (fieldChanges.length > 0) {
      fieldChanges.forEach(change => lines.push(`${lineItemLabel(newItem)}: ${change}`))
    } else if (String(oldItem.description ?? '') !== String(newItem.description ?? '')) {
      lines.push('Service item updated')
    }
  }

  return lines.length ? lines : ['Line items updated']
}

// One field's before/after -> either a plain {type:'diff'} pair (rendered
// as a from/to line, the common case) or {type:'notes'} (a list of plain
// strings, currently just line_items) - callers branch on `type` instead
// of special-casing field names themselves, so a future field needing the
// same "not a plain scalar" treatment only has to be added here once.
// A before/after longer than this (a rich-text body, a whole PDF designer
// layout, ...) isn't readable as "old → new" on one line - it only gets a
// plain "<Field> updated" note instead.
const MAX_DIFF_VALUE_LENGTH = 80
const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

export const describeFieldChange = (field, from, to) => {
  if (field === 'line_items') {
    return { type: 'notes', lines: describeLineItemsChange(from, to) }
  }
  if (
    isPlainObject(from) ||
    isPlainObject(to) ||
    formatValue(from).length > MAX_DIFF_VALUE_LENGTH ||
    formatValue(to).length > MAX_DIFF_VALUE_LENGTH
  ) {
    return { type: 'notes', lines: [`${formatFieldName(field)} updated`] }
  }
  return { type: 'diff', from, to }
}

export const ACTION_META = {
  create: { label: 'Created', color: 'light-success' },
  update: { label: 'Edited', color: 'light-warning' },
  delete: { label: 'Deleted', color: 'light-danger' }
}

// One row's changes -> {badgeLabel, badgeColor, lines}, shared by the
// Activity Log list page and the per-record History popup so both read
// the same way. `payment_recorded`/`email_sent` (see
// InvoicePaymentController and MailboxOutbox::processOne() respectively)
// get their own bold-title treatment instead of a bulleted from/to line,
// same idea as this app's other "this one field means something more
// specific than a generic edit" cases.
export const describeActivityRow = row => {
  if (row.action === 'create') {
    return { badgeLabel: ACTION_META.create.label, badgeColor: ACTION_META.create.color, lines: [{ bold: `${formatEntityType(row.entity_type)} created` }] }
  }
  if (row.action === 'delete') {
    return { badgeLabel: ACTION_META.delete.label, badgeColor: ACTION_META.delete.color, lines: [{ bold: `${formatEntityType(row.entity_type)} deleted` }] }
  }

  const changes = row.changes || {}
  if (changes.payment_recorded) {
    return {
      badgeLabel: 'Payment',
      badgeColor: 'light-success',
      lines: [{ bold: 'Payment recorded', muted: formatValue(changes.payment_recorded.to) }]
    }
  }
  if (changes.email_sent) {
    const { recipients, subject } = changes.email_sent.to || {}
    return {
      badgeLabel: 'Sent',
      badgeColor: 'light-success',
      lines: [{ bold: `Emailed to ${(recipients || []).join(', ') || 'recipient'}`, muted: subject }]
    }
  }

  const lines = Object.keys(changes).flatMap(field => {
    const described = describeFieldChange(field, changes[field].from, changes[field].to)
    return described.type === 'notes'
      ? described.lines.map(line => ({ bullet: line }))
      : [{ bullet: `${formatFieldName(field)}: ${formatValue(described.from)} → ${formatValue(described.to)}` }]
  })

  return {
    badgeLabel: ACTION_META.update.label,
    badgeColor: ACTION_META.update.color,
    lines: lines.length ? lines : [{ bold: `${formatEntityType(row.entity_type)} updated` }]
  }
}

// The description cell body both tables render - title/bullet lines plus
// an optional muted sub-line.
export const ActivityLines = ({ lines }) => (
  <div style={{ fontSize: '0.95rem' }}>
    {lines.map((line, index) =>
      line.bullet ? (
        <div key={index}>&bull; {line.bullet}</div>
      ) : (
        <div key={index}>
          <span>{line.bold}</span>
          {/* text-muted in this theme is quite low-contrast - text-body
              at a slightly reduced opacity keeps this line clearly
              secondary to the title above it without being hard to read. */}
          {line.muted && (
            <div className='text-body' style={{ opacity: 0.75 }}>
              {line.muted}
            </div>
          )}
        </div>
      )
    )}
  </div>
)

// Date & Time column cell - date on top, time on its own line beneath it,
// right-aligned to match the column.
export const ActivityDateTime = ({ value }) => (
  <div className='text-end'>
    <div>{formatDate(value, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
    <small className='text-body' style={{ opacity: 0.75 }}>
      {formatDate(value, { hour: '2-digit', minute: '2-digit' })}
    </small>
  </div>
)
