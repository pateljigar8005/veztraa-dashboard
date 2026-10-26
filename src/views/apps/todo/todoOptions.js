// MantisBT's default enums. Values must stay in sync with the constants on
// veztraa-api's Todo.php.
const toOptions = labels => Object.entries(labels).map(([value, label]) => ({ value, label }))

export const statusLabels = {
  new: 'New',
  feedback: 'Feedback',
  acknowledged: 'Acknowledged',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  resolved: 'Resolved',
  closed: 'Closed'
}

// Mantis's own status colors - used to tint list rows and status chips.
export const statusBgColors = {
  new: '#fcbdbd',
  feedback: '#e3b7eb',
  acknowledged: '#ffcd85',
  confirmed: '#fff494',
  assigned: '#c2dfff',
  resolved: '#d2f5b0',
  closed: '#c9ccc4'
}

export const severityLabels = {
  feature: 'Feature',
  trivial: 'Trivial',
  text: 'Text',
  tweak: 'Tweak',
  minor: 'Minor',
  major: 'Major',
  crash: 'Crash',
  block: 'Block'
}

export const priorityLabels = {
  none: 'None',
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
  immediate: 'Immediate'
}

// Theme color names per priority - Calendar tiles and the dashboard
// timeline color todo items by these.
export const priorityColors = {
  none: 'secondary',
  low: 'secondary',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
  immediate: 'danger'
}

export const reproducibilityLabels = {
  always: 'Always',
  sometimes: 'Sometimes',
  random: 'Random',
  have_not_tried: 'Have not tried',
  unable_to_reproduce: 'Unable to reproduce',
  n_a: 'N/A'
}

export const resolutionLabels = {
  open: 'Open',
  fixed: 'Fixed',
  reopened: 'Reopened',
  unable_to_reproduce: 'Unable to reproduce',
  not_fixable: 'Not fixable',
  duplicate: 'Duplicate',
  no_change_required: 'No change required',
  suspended: 'Suspended',
  wont_fix: "Won't fix"
}

export const categoryLabels = {
  general: 'General',
  ui: 'UI',
  backend: 'Backend',
  api: 'API',
  database: 'Database',
  documentation: 'Documentation',
  other: 'Other'
}

// How each relationship reads from the issue you're looking at.
export const relationshipLabels = {
  duplicate_of: 'duplicate of',
  has_duplicate: 'has duplicate',
  related_to: 'related to',
  parent_of: 'parent of',
  child_of: 'child of'
}

// Common Platform / OS picks - the form also accepts anything typed in.
const plainOptions = values => values.map(value => ({ value, label: value }))
export const platformOptions = plainOptions(['Web', 'Mobile Web', 'Android App', 'iOS App', 'Desktop App', 'API', 'Admin Panel'])
export const osOptions = plainOptions(['Windows 11', 'Windows 10', 'macOS', 'Linux', 'Ubuntu', 'Android', 'iOS', 'iPadOS', 'ChromeOS'])

export const statusOptions = toOptions(statusLabels)
export const severityOptions = toOptions(severityLabels)
export const priorityOptions = toOptions(priorityLabels)
export const reproducibilityOptions = toOptions(reproducibilityLabels)
export const resolutionOptions = toOptions(resolutionLabels)
export const categoryOptions = toOptions(categoryLabels)
export const relationshipOptions = toOptions(relationshipLabels)

export const DONE_STATUSES = ['resolved', 'closed']

// Mantis shows ids zero-padded to 7 digits (0000123).
export const issueNumber = id => String(id).padStart(7, '0')
