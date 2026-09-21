// Shared formatting for anything rendering an activity_logs row's `changes`
// object - the Activity Log list page's own diff modal
// (src/views/apps/activity-log/list/columns.js) and the per-record History
// popup (src/views/apps/activity-log/HistoryModal.js). Both need the exact
// same value formatting, so it lives here once rather than risking the two
// drifting apart (a fix applied to only one place silently reappearing in
// the other).

// entity_type/field names are stored as lowercase, underscore-separated
// slugs (see ActivityLogger::log() callers, e.g. 'service_item',
// 'payment_method') - this is purely a display transform, it never changes
// what's persisted.
export const formatEntityType = value =>
  (value || '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

// A changed field's key is either a plain column name ('email') or, for
// Role.permissions (see ActivityLogger::diffPermissions()), a
// "module.action" pair ('kanban.add') - rendered as "Kanban → Add" rather
// than left as a raw dotted key.
export const formatFieldName = field =>
  field
    .split('.')
    .map(formatEntityType)
    .join(' → ')

const MAX_VALUE_LENGTH = 160
const truncate = text => (text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text)

// ActivityLogger::diff() hands back real decoded values for JSON columns
// (line_items, ...), not a raw JSON string - this still has to turn
// whatever shape shows up into something readable rather than dumping it
// as-is, since a raw object/array would otherwise print as
// "[object Object]" and a full rich-text field (Contract.body,
// TermsTemplate.content, ...) would print its entire content as one
// unbroken line.
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

// line_items (Invoice/Quotation) needs its own diff, not the generic
// "dump the whole array" formatValue() gives every other field - a
// service item's description is free text nobody needs word-for-word in
// an audit trail (so a pure text edit just says "Service item updated"),
// but its quantity/amount are numbers worth showing exactly, so those get
// a real before/after per item that actually changed.
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

    // Each changed field is its own bullet line, not comma-joined onto one -
    // a single long "Quantity: 2 → 1, Amount: 8000 → 7500" line is exactly
    // the "wall of text" this whole diff was built to avoid.
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
export const describeFieldChange = (field, from, to) => {
  if (field === 'line_items') {
    return { type: 'notes', lines: describeLineItemsChange(from, to) }
  }
  return { type: 'diff', from, to }
}
