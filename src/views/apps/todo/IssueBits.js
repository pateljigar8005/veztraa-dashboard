import { formatDate } from '@utils'
import { statusLabels, statusBgColors, priorityLabels, severityLabels } from './todoOptions'

const chipStyle = { borderRadius: '0.3rem', fontSize: '0.8rem', fontWeight: 500, padding: '0.3rem 0.55rem', lineHeight: 1.2 }

// Mantis status chip: its own pastel color, always dark text so it reads
// the same in light and dark theme.
export const StatusBadge = ({ status }) => (
  <span
    className='d-inline-block text-nowrap'
    style={{ ...chipStyle, background: statusBgColors[status] || '#e0e0e0', color: '#3b3b3b' }}
  >
    {statusLabels[status] || status}
  </span>
)

// Priority and severity: a small rounded square in the level's color,
// then the plain label.
const PRIORITY_COLOR = {
  none: 'secondary',
  low: 'secondary',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
  immediate: 'danger'
}

const SEVERITY_COLOR = {
  feature: 'info',
  trivial: 'secondary',
  text: 'secondary',
  tweak: 'secondary',
  minor: 'primary',
  major: 'warning',
  crash: 'danger',
  block: 'danger'
}

const LevelLabel = ({ color, children }) => (
  <span className='d-inline-flex align-items-center text-nowrap'>
    <span className={`bg-${color} flex-shrink-0 me-50`} style={{ width: 14, height: 14, borderRadius: 4 }} />
    {children}
  </span>
)

export const PriorityBadge = ({ priority }) => (
  <LevelLabel color={PRIORITY_COLOR[priority] || 'secondary'}>{priorityLabels[priority] || priority}</LevelLabel>
)

export const SeverityBadge = ({ severity }) => (
  <LevelLabel color={SEVERITY_COLOR[severity] || 'secondary'}>{severityLabels[severity] || severity}</LevelLabel>
)

// MySQL "YYYY-MM-DD HH:MM:SS" timestamps.
export const formatDateTime = value =>
  value ? formatDate(value.replace(' ', 'T'), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

// Date-only strings parsed as local midnight - new Date('YYYY-MM-DD') is UTC
// and can show the previous day in timezones behind UTC.
export const formatDay = value => (value ? formatDate(`${value}T00:00:00`, { day: 'numeric', month: 'short', year: 'numeric' }) : '')
