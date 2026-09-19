export const taskTypeOptions = [
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'improvement', label: 'Improvement' }
]

export const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

export const taskTypeColors = {
  task: 'primary',
  bug: 'danger',
  feature: 'success',
  improvement: 'info'
}

export const priorityColors = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  urgent: 'danger'
}