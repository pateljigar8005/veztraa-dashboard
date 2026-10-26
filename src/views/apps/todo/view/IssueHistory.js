import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle } from 'reactstrap'
import DataTable from 'react-data-table-component'
import ReactPaginate from 'react-paginate'
import { ChevronDown } from 'react-feather'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import ListHeader from '../ListHeader'
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

  // Client-side search and paging - an issue's history is loaded whole.
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const rows = useMemo(
    () =>
      // Newest first, like other module lists.
      [...history].reverse().map(h => {
        const [field, change] = describe(h)
        return { id: h.id, date: h.created_at, user: h.user_name || 'System', field, change: change || '' }
      }),
    [history]
  )

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => [r.user, r.field, r.change, formatDateTime(r.date)].some(v => v.toLowerCase().includes(q)))
  }, [rows, searchTerm])

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const page = Math.min(currentPage, pageCount)
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const columns = [
    { name: 'Date Modified', width: '200px', selector: r => r.date, cell: r => <span className='text-nowrap'>{formatDateTime(r.date)}</span> },
    { name: 'Username', minWidth: '160px', selector: r => r.user },
    { name: 'Field', minWidth: '180px', selector: r => r.field },
    { name: 'Change', minWidth: '260px', grow: 2, selector: r => r.change, cell: r => <span style={{ wordBreak: 'break-word' }}>{r.change}</span> }
  ]

  const CustomPagination = () => (
    <ReactPaginate
      previousLabel=''
      nextLabel=''
      pageCount={pageCount}
      activeClassName='active'
      forcePage={page - 1}
      onPageChange={p => setCurrentPage(p.selected + 1)}
      pageClassName='page-item'
      nextLinkClassName='page-link'
      nextClassName='page-item next'
      previousClassName='page-item prev'
      previousLinkClassName='page-link'
      pageLinkClassName='page-link'
      containerClassName='pagination react-paginate justify-content-end my-2 pe-1'
    />
  )

  return (
    <Card>
      <CardHeader className='pb-0'>
        <CardTitle tag='h5' className='mb-0'>
          Issue History
        </CardTitle>
      </CardHeader>
      <div className='react-dataTable'>
        <DataTable
          noHeader
          subHeader
          pagination
          paginationServer
          responsive
          columns={columns}
          data={pageRows}
          sortIcon={<ChevronDown />}
          className='react-dataTable'
          paginationComponent={CustomPagination}
          noDataComponent={<div className='text-muted py-2'>{searchTerm ? 'No matching history.' : 'No history yet.'}</div>}
          subHeaderComponent={
            <ListHeader
              id='issue-history'
              rowsPerPage={rowsPerPage}
              onPerPage={value => {
                setRowsPerPage(value)
                setCurrentPage(1)
              }}
              searchTerm={searchTerm}
              onSearch={value => {
                setSearchTerm(value)
                setCurrentPage(1)
              }}
            />
          }
        />
      </div>
    </Card>
  )
}

export default IssueHistory
