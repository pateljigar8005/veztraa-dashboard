import { useState } from 'react'
import { Eye } from 'react-feather'
import { Badge, Button, Modal, ModalHeader, ModalBody, UncontrolledTooltip } from 'reactstrap'
import { formatDate } from '@utils'
import { formatEntityType, formatFieldName, formatValue, describeFieldChange } from '@src/utility/activityLogFormat'

const ACTION_COLORS = {
  create: 'light-success',
  update: 'light-warning',
  delete: 'light-danger'
}

const ChangesCell = ({ row }) => {
  const [open, setOpen] = useState(false)
  const changes = row.changes

  if (!changes || Object.keys(changes).length === 0) {
    return <span className='text-muted'>&mdash;</span>
  }

  const fields = Object.keys(changes)

  return (
    <>
      <Button
        id={`changes-tooltip-${row.id}`}
        className='btn-icon'
        color='flat-secondary'
        size='sm'
        onClick={() => setOpen(true)}
      >
        <Eye size={16} />
      </Button>
      <UncontrolledTooltip placement='top' target={`changes-tooltip-${row.id}`}>
        {fields.length} field{fields.length > 1 ? 's' : ''} changed
      </UncontrolledTooltip>
      <Modal isOpen={open} toggle={() => setOpen(false)} size='lg'>
        <ModalHeader toggle={() => setOpen(false)}>
          {formatEntityType(row.entity_type)} {row.entity_label ? `- ${row.entity_label}` : ''}
        </ModalHeader>
        <ModalBody>
          {/* GitLab-style unified diff (- removed line in red, + added line
              in green) per changed field, built from our own bg-light-danger/
              bg-light-success tokens - the same red/green vocabulary this
              app already uses for status badges - rather than pulling in a
              diff-rendering library for what's just single-value changes. */}
          {fields.map(field => {
            const { from, to } = changes[field]
            const described = describeFieldChange(field, from, to)
            return (
              <div key={field} className='mb-1'>
                <div className='fw-bolder mb-50'>{formatFieldName(field)}</div>
                {described.type === 'notes' ? (
                  described.lines.map((line, index) => (
                    <div key={index} className='small'>
                      &bull; {line}
                    </div>
                  ))
                ) : (
                  <div className='font-monospace small rounded overflow-hidden border'>
                    <div className='bg-light-danger text-danger px-1 py-50 text-break'>
                      <span className='me-50'>&minus;</span>
                      {formatValue(described.from)}
                    </div>
                    <div className='bg-light-success text-success px-1 py-50 text-break'>
                      <span className='me-50'>+</span>
                      {formatValue(described.to)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </ModalBody>
      </Modal>
    </>
  )
}

export const columns = [
  {
    name: 'When',
    minWidth: '160px',
    sortable: true,
    sortField: 'created_at',
    selector: row => row.created_at,
    cell: row => <span>{formatDate(row.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
  },
  {
    name: 'User',
    minWidth: '200px',
    selector: row => row.user_name,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
        <span className='fw-bolder text-truncate'>{row.user_name || 'System'}</span>
        {row.user_role && <small className='text-muted text-capitalize'>{row.user_role}</small>}
      </div>
    )
  },
  {
    name: 'Action',
    minWidth: '110px',
    sortable: true,
    sortField: 'action',
    selector: row => row.action,
    cell: row => (
      <Badge color={ACTION_COLORS[row.action] || 'light-secondary'} className='text-capitalize'>
        {row.action}
      </Badge>
    )
  },
  {
    name: 'Entity',
    minWidth: '260px',
    sortable: true,
    sortField: 'entity_type',
    selector: row => row.entity_type,
    cell: row => (
      <div className='d-flex flex-column overflow-hidden' style={{ minWidth: 0 }}>
        <span className='fw-bolder'>{formatEntityType(row.entity_type)}</span>
        {row.entity_label && (
          <small className='text-muted text-truncate' title={row.entity_label}>
            {row.entity_label}
          </small>
        )}
      </div>
    )
  },
  {
    name: 'Changes',
    center: true,
    minWidth: '100px',
    cell: row => <ChangesCell row={row} />
  }
]
