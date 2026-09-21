import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { Clock, Search, ChevronDown } from 'react-feather'
import { Badge, Button, Input, InputGroup, InputGroupText, Modal, ModalHeader, ModalBody, Spinner } from 'reactstrap'
import { formatDate } from '@utils'
import { currentUserCan } from '@src/utility/navPermissions'
import { formatFieldName, formatValue, describeFieldChange } from '@src/utility/activityLogFormat'
import '@styles/react/libs/tables/react-dataTable-component.scss'

// Reusable "History" popup for a single record's own timeline - backs onto
// GET /activity-logs/{entityType}/{entityId} (ActivityLogController::
// forEntity(), admin-only), the same activity_logs rows the Activity Log
// list page shows, just scoped to one record. Uses the same
// formatFieldName/formatValue as that list page's own diff modal
// (src/utility/activityLogFormat.js) so a fix to how a value renders never
// has to be made twice.
//
// The table itself is the real react-data-table-component DataTable, wired
// exactly the way every list page's own Table.js wires it (sortServer +
// paginationServer + a ReactPaginate paginationComponent, className=
// 'react-dataTable' so react-dataTable-component.scss's styling actually
// applies) - a hand-rolled <table> here kept drifting from the rest of the
// app's look (header size/weight, sort icons, ...) piece by piece; using
// the same component the rest of the app uses ends that for good instead
// of chasing each mismatch as it's noticed.
//
// No visible trigger of its own - `buttonId` is a hidden button (same
// className='d-none' + id pattern as <module>-send-email-btn/<module>-
// download-pdf-btn in each view/index.js), clicked by NavbarBookmarks.js's
// History icon (historyButtonIdByRoute) instead of a button on the page
// itself, so every document detail page's History action lives in one
// place in the navbar rather than a differently-styled button per module.
const ACTION_META = {
  create: { label: 'Created', color: 'light-success' },
  update: { label: 'Edited', color: 'light-warning' },
  delete: { label: 'Deleted', color: 'light-danger' }
}

// One row's changes -> {badge, description}. `payment_recorded`/
// `email_sent` (see InvoicePaymentController and MailboxOutbox::
// processOne() respectively) get their own bold-title treatment instead
// of a bulleted from/to line, same idea as this app's other "this one
// field means something more specific than a generic edit" cases.
const describeRow = row => {
  if (row.action === 'create') {
    return { badgeLabel: ACTION_META.create.label, badgeColor: ACTION_META.create.color, lines: [{ bold: `${formatFieldName(row.entity_type)} created` }] }
  }
  if (row.action === 'delete') {
    return { badgeLabel: ACTION_META.delete.label, badgeColor: ACTION_META.delete.color, lines: [{ bold: `${formatFieldName(row.entity_type)} deleted` }] }
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

  const fields = Object.keys(changes)
  const lines = fields.flatMap(field => {
    const described = describeFieldChange(field, changes[field].from, changes[field].to)
    return described.type === 'notes'
      ? described.lines.map(line => ({ bullet: line }))
      : [{ bullet: `${formatFieldName(field)}: ${formatValue(described.from)} → ${formatValue(described.to)}` }]
  })

  return {
    badgeLabel: ACTION_META.update.label,
    badgeColor: ACTION_META.update.color,
    lines: lines.length ? lines : [{ bold: `${formatFieldName(row.entity_type)} updated` }]
  }
}

// Description is the only column with anything worth reading at length -
// the other three stay narrow (minWidth only, no grow) instead of the row
// splitting into four even columns.
const columns = [
  {
    name: 'Description',
    sortField: 'description',
    sortable: true,
    minWidth: '320px',
    selector: row => row.lines[0]?.bold || row.lines[0]?.bullet || '',
    cell: row => (
      <div className='py-50' style={{ fontSize: '0.95rem' }}>
        {row.lines.map((line, index) =>
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
  },
  {
    // width (not minWidth) - a fixed width takes a column out of the
    // flex-grow distribution entirely, instead of it also claiming a
    // share of whatever space is left over (which is what was stretching
    // this and the next two columns wider than their content needed).
    // Description above, the only column left without a fixed width,
    // absorbs 100% of what's left as a result.
    name: 'User',
    sortField: 'user_name',
    sortable: true,
    right: true,
    width: '160px',
    selector: row => row.user_name || '',
    cell: row => row.user_name || '—'
  },
  {
    name: 'Date & Time',
    sortField: 'created_at',
    sortable: true,
    right: true,
    width: '180px',
    selector: row => row.created_at,
    cell: row => formatDate(row.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  },
  {
    name: 'Status',
    sortField: 'badgeLabel',
    sortable: true,
    right: true,
    width: '110px',
    selector: row => row.badgeLabel,
    cell: row => (
      <Badge color={row.badgeColor} pill>
        {row.badgeLabel}
      </Badge>
    )
  }
]

const HistoryModal = ({ entityType, entityId, entityLabel, buttonId }) => {
  // ActivityLogController::forEntity() is hard admin-only server-side
  // (same as ApiTokenController) - this mirrors that with the same
  // routeToMenuId entry ('activityLogs') the Activity Log list page's own
  // route is gated by, rather than hardcoding role === 'admin' here too.
  const canView = currentUserCan('/activity-log', 'view')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    axios
      .get(`/activity-logs/${entityType}/${entityId}`)
      .then(response => setRows(response.data.data.activityLogs.map(row => ({ ...row, ...describeRow(row) }))))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [open, entityType, entityId])

  const handleSort = (column, direction) => {
    setSortColumn(column.sortField)
    setSortDirection(direction)
  }

  const visibleRows = useMemo(() => {
    let list = rows
    if (dateFrom) list = list.filter(row => row.created_at.slice(0, 10) >= dateFrom)
    if (dateTo) list = list.filter(row => row.created_at.slice(0, 10) <= dateTo)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(row => {
        const text = [row.user_name, row.entity_label, ...row.lines.map(l => l.bold || l.bullet || l.muted || '')].join(' ').toLowerCase()
        return text.includes(q)
      })
    }

    const column = columns.find(c => c.sortField === sortColumn) || columns[2]
    const direction = sortDirection === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const av = column.selector(a)
      const bv = column.selector(b)
      return av < bv ? -1 * direction : av > bv ? 1 * direction : 0
    })
  }, [rows, dateFrom, dateTo, search, sortColumn, sortDirection])

  // Same client-side pagination shape as every other list page's
  // ReactPaginate (see e.g. contact-submission/list/Table.js's
  // CustomPagination) - a plain page/perPage slice here instead of a
  // server round-trip, since a single record's whole history is already
  // one small fetch (see the effect above), not worth re-querying per page.
  useEffect(() => {
    setCurrentPage(1)
  }, [dateFrom, dateTo, search, rowsPerPage, rows])

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / rowsPerPage))
  const pagedRows = visibleRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const CustomPagination = () => (
    <ReactPaginate
      previousLabel=''
      nextLabel=''
      pageCount={pageCount}
      forcePage={currentPage - 1}
      onPageChange={page => setCurrentPage(page.selected + 1)}
      activeClassName='active'
      pageClassName='page-item'
      nextLinkClassName='page-link'
      nextClassName='page-item next'
      previousClassName='page-item prev'
      previousLinkClassName='page-link'
      pageLinkClassName='page-link'
      containerClassName='pagination react-paginate justify-content-end my-2 pe-1'
    />
  )

  if (!canView) return null

  return (
    <>
      <Button id={buttonId} className='d-none' onClick={() => setOpen(true)}>
        History
      </Button>
      <Modal isOpen={open} toggle={() => setOpen(false)} size='xl'>
        <ModalHeader toggle={() => setOpen(false)}>
          <Clock size={18} className='me-50' />
          History
        </ModalHeader>
        <ModalBody>
          <div className='d-flex flex-wrap align-items-center gap-1 mb-1'>
            <Input type='date' value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ maxWidth: 170 }} />
            <Input type='date' value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ maxWidth: 170 }} />
            {/* Bootstrap's .input-group defaults to width: 100%, which was
                forcing this onto its own line inside the flex-wrap row
                above instead of sitting alongside the two date fields -
                width: 'auto' (inline, so it wins over the class) undoes that. */}
            <InputGroup className='flex-grow-1' style={{ minWidth: 200, width: 'auto' }}>
              <InputGroupText>
                <Search size={14} />
              </InputGroupText>
              <Input placeholder='Search history...' value={search} onChange={e => setSearch(e.target.value)} />
            </InputGroup>
            <div className='d-flex align-items-center ms-auto'>
              <label htmlFor='history-rows-per-page' className='mb-0 text-nowrap me-50'>
                Show
              </label>
              <Input
                type='select'
                id='history-rows-per-page'
                value={rowsPerPage}
                onChange={e => setRowsPerPage(Number(e.target.value))}
                style={{ width: '5rem' }}
              >
                <option value='10'>10</option>
                <option value='25'>25</option>
                <option value='50'>50</option>
              </Input>
            </div>
          </div>

          {loading ? (
            <div className='d-flex justify-content-center p-3'>
              <Spinner size='sm' color='primary' />
            </div>
          ) : visibleRows.length === 0 ? (
            <div className='d-flex flex-column align-items-center text-center py-3'>
              <div className='avatar avatar-xl bg-light-secondary mb-1'>
                <div className='avatar-content'>
                  <Clock size={26} />
                </div>
              </div>
              {rows.length === 0 ? (
                <p className='text-muted mb-0'>No history{entityLabel ? ` for ${entityLabel}` : ''} yet.</p>
              ) : (
                <>
                  <p className='text-muted mb-50'>No history matches your filters.</p>
                  <Button
                    color='link'
                    size='sm'
                    className='p-0'
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                      setSearch('')
                    }}
                  >
                    Clear filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <DataTable
              responsive
              sortServer
              pagination
              paginationServer
              columns={columns}
              data={pagedRows}
              onSort={handleSort}
              defaultSortField='created_at'
              defaultSortAsc={false}
              sortIcon={<ChevronDown />}
              className='react-dataTable'
              paginationComponent={CustomPagination}
            />
          )}
        </ModalBody>
      </Modal>
    </>
  )
}

export default HistoryModal
