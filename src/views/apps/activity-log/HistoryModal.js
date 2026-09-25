import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { Clock, Search, ChevronDown } from 'react-feather'
import { Badge, Button, Input, InputGroup, InputGroupText, Modal, ModalHeader, ModalBody, Spinner } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import { describeActivityRow, ActivityLines, ActivityDateTime } from '@src/utility/activityLogFormat'
import '@styles/react/libs/tables/react-dataTable-component.scss'

// Record history uses the shared activity formatter and a hidden trigger
// so the navbar can open the same modal from every detail page.

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
    cell: row => <ActivityLines lines={row.lines} />
  },
  {
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
    cell: row => <ActivityDateTime value={row.created_at} />
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
  // Use the same permission check as the activity-log page.
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
      .then(response => setRows(response.data.data.activityLogs.map(row => ({ ...row, ...describeActivityRow(row) }))))
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

  // The full history is already loaded, so pagination stays client-side.
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
              className='react-dataTable auto-height-rows'
              paginationComponent={CustomPagination}
            />
          )}
        </ModalBody>
      </Modal>
    </>
  )
}

export default HistoryModal
