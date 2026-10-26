import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, Table } from 'reactstrap'
import { getHistory } from '../store'
import { formatDateTime, formatDay } from '../IssueBits'
import {
  statusLabels,
  severityLabels,
  priorityLabels,
  reproducibilityLabels,
  resolutionLabels,
  categoryLabels,
  relationshipLabels,
  issueNumber
} from '../todoOptions'

const FIELD_LABELS = {
  summary: 'Summary',
  project: 'Project',
  assigned_to: 'Assigned To',
  category: 'Category',
  severity: 'Severity',
  priority: 'Priority',
  reproducibility: 'Reproducibility',
  status: 'Status',
  resolution: 'Resolution',
  platform: 'Platform',
  os: 'OS',
  os_build: 'OS Build',
  product_version: 'Product Version',
  target_version: 'Target Version',
  fixed_in_version: 'Fixed in Version',
  due_date: 'Due Date',
  description: 'Description',
  steps_to_reproduce: 'Steps to Reproduce',
  additional_info: 'Additional Information'
}

const VALUE_LABELS = {
  status: statusLabels,
  severity: severityLabels,
  priority: priorityLabels,
  reproducibility: reproducibilityLabels,
  resolution: resolutionLabels,
  category: categoryLabels
}

const LONG_TEXT = ['description', 'steps_to_reproduce', 'additional_info']

const valueLabel = (field, value) => {
  if (value === null || value === undefined || value === '') return ''
  if (field === 'due_date') return formatDay(value)
  return VALUE_LABELS[field]?.[value] || value
}

// One history row -> [Field, Change], worded the way Mantis words them.
const describe = h => {
  switch (h.type) {
    case 'new_issue':
      return ['New Issue', '']
    case 'note_added':
      return ['Note Added', h.new_value ? issueNumber(h.new_value) : '']
    case 'note_edited':
      return ['Note Edited', h.new_value ? issueNumber(h.new_value) : '']
    case 'note_deleted':
      return ['Note Deleted', h.old_value ? issueNumber(h.old_value) : '']
    case 'file_added':
      return ['File Added', h.new_value]
    case 'file_deleted':
      return ['File Deleted', h.old_value]
    case 'relationship_added':
      return ['Relationship added', `${h.field ? `${relationshipLabels[h.field] || h.field} ` : ''}${issueNumber(h.new_value)}`]
    case 'relationship_deleted':
      return ['Relationship deleted', issueNumber(h.old_value)]
    case 'monitor_added':
      return ['Issue Monitored', h.new_value]
    case 'monitor_deleted':
      return ['Issue End Monitor', h.old_value]
    default: {
      const label = FIELD_LABELS[h.field] || h.field
      if (LONG_TEXT.includes(h.field)) return [`${label} Updated`, '']
      const from = valueLabel(h.field, h.old_value)
      const to = valueLabel(h.field, h.new_value)
      return [label, `${from || '(empty)'} => ${to || '(empty)'}`]
    }
  }
}

const IssueHistory = ({ issueId }) => {
  const dispatch = useDispatch()
  const history = useSelector(state => state.todo.history)

  useEffect(() => {
    dispatch(getHistory(issueId))
  }, [issueId])

  return (
    <Card>
      <CardHeader className='pb-50'>
        <CardTitle tag='h5' className='mb-0'>
          Issue History
        </CardTitle>
      </CardHeader>
      <Table responsive size='sm' striped className='mb-0'>
        <thead>
          <tr>
            <th style={{ width: 190 }}>Date Modified</th>
            <th style={{ width: 180 }}>Username</th>
            <th style={{ width: 200 }}>Field</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {history.map(h => {
            const [field, change] = describe(h)
            return (
              <tr key={h.id}>
                <td className='text-nowrap'>{formatDateTime(h.created_at)}</td>
                <td>{h.user_name || 'System'}</td>
                <td>{field}</td>
                <td style={{ wordBreak: 'break-word' }}>{change}</td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </Card>
  )
}

export default IssueHistory
