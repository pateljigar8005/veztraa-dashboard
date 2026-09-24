// Moved out of the (now-removed) Kanban module's kanbanOptions.js - Todo
// and Calendar's Todo-task tiles are the only remaining consumers of a
// task's priority, so this lives here rather than in a shared/ folder.
export const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

export const priorityColors = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  urgent: 'danger'
}

// A real multi-state Status (not just the done/not-done checkbox) so a
// team can see what's actually in flight at a glance, not just what's
// finished. Fixed list, same for everyone (unlike Kanban's old
// freely-renamable columns) - see Todo::VALID_STATUSES on the API side,
// which must stay in sync with these values.
export const statusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' }
]

export const statusColors = {
  not_started: 'secondary',
  in_progress: 'warning',
  in_review: 'info',
  on_hold: 'danger',
  completed: 'success'
}
