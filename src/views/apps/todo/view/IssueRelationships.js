import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import AsyncSelect from 'react-select/async'
import { useDispatch } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Table, Button } from 'reactstrap'
import { X } from 'react-feather'
import { selectThemeColors } from '@utils'
import { addRelationship, deleteRelationship } from '../store'
import { StatusBadge } from '../IssueBits'
import { relationshipOptions, relationshipLabels, resolutionLabels, issueNumber } from '../todoOptions'

// Mantis "Relationships": duplicate of / has duplicate, related to,
// parent of / child of. Each link shows up on both issues.
const IssueRelationships = ({ issue, canEdit }) => {
  const dispatch = useDispatch()
  const [type, setType] = useState('related_to')
  const [other, setOther] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadIssues = q =>
    axios
      .get('/todos/lookup', { params: { q } })
      .then(r =>
        r.data.data
          .filter(i => i.id !== issue.id)
          .map(i => ({ value: i.id, label: `${issueNumber(i.id)} - ${i.title}` }))
      )
      .catch(() => [])

  const handleAdd = () => {
    if (!other) return
    setSaving(true)
    dispatch(addRelationship({ id: issue.id, type, otherId: other.value }))
      .unwrap()
      .then(() => setOther(null))
      .catch(err => toast.error(err?.message || 'Failed to add relationship'))
      .finally(() => setSaving(false))
  }

  const handleDelete = relationship =>
    dispatch(deleteRelationship({ id: relationship.id, issueId: issue.id }))
      .unwrap()
      .catch(err => toast.error(err?.message || 'Failed to remove relationship'))

  return (
    <Card>
      <CardHeader className='pb-50'>
        <CardTitle tag='h5' className='mb-0'>
          Relationships
        </CardTitle>
      </CardHeader>
      <CardBody className='pb-1'>
        {canEdit && (
          <div className='d-flex flex-wrap align-items-center mb-1' style={{ gap: '0.5rem' }}>
            <span className='text-muted'>Current issue</span>
            <div style={{ width: 170 }}>
              <Select
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                options={relationshipOptions}
                value={relationshipOptions.find(o => o.value === type)}
                onChange={option => setType(option.value)}
              />
            </div>
            <div className='flex-grow-1' style={{ minWidth: 240 }}>
              <AsyncSelect
                classNamePrefix='select'
                className='react-select'
                theme={selectThemeColors}
                cacheOptions
                loadOptions={loadIssues}
                value={other}
                onChange={setOther}
                isClearable
                placeholder='Issue # or summary...'
                noOptionsMessage={({ inputValue }) => (inputValue ? 'No matching issues' : 'Type an issue # or summary')}
              />
            </div>
            <Button color='primary' disabled={!other || saving} onClick={handleAdd}>
              Add
            </Button>
          </div>
        )}
        {issue.relationships.length === 0 ? (
          <p className='text-muted mb-0'>No related issues.</p>
        ) : (
          <Table responsive size='sm' className='mb-0'>
            <tbody>
              {issue.relationships.map(r => (
                <tr key={r.id}>
                  <td className='text-nowrap' style={{ width: 130 }}>
                    {relationshipLabels[r.type] || r.type}
                  </td>
                  <td className='text-nowrap' style={{ width: 100 }}>
                    <Link to={`/todo/view/${r.issue.id}`}>{issueNumber(r.issue.id)}</Link>
                  </td>
                  <td className='text-nowrap' style={{ width: 1 }}>
                    <StatusBadge status={r.issue.status} />
                  </td>
                  <td className='text-muted text-nowrap'>
                    {r.issue.handler_name || ''}
                    {r.issue.resolution !== 'open' ? ` · ${resolutionLabels[r.issue.resolution] || r.issue.resolution}` : ''}
                  </td>
                  <td style={{ wordBreak: 'break-word' }}>{r.issue.title}</td>
                  {canEdit && (
                    <td className='text-end' style={{ width: 1 }}>
                      <X size={14} className='cursor-pointer text-muted' onClick={() => handleDelete(r)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  )
}

export default IssueRelationships
