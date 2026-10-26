import { Fragment, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ChevronDown, CheckSquare as EmptyIcon } from 'react-feather'
import { Row, Col, Card, Input, Button, Label } from 'reactstrap'
import useClampPage from '@hooks/useClampPage'
import useDebounce from '@hooks/useDebounce'
import UILoader from '@components/ui-loader'
import TableRowsSkeleton from '@components/skeleton/TableRowsSkeleton'
import AdvancedSearchModal from '../../shared/AdvancedSearchModal'
import TableEmptyState, { hasActiveFilters } from '../../shared/TableEmptyState'
import { columns } from './columns'
import { getData } from '../store'
import { fetchUserOptions, fetchProjectOptions } from '../pickerOptions'
import {
  statusOptions,
  severityOptions,
  priorityOptions,
  categoryOptions,
  resolutionOptions,
  statusBgColors
} from '../todoOptions'
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'

const searchFields = [
  { name: 'project_id', label: 'Project', type: 'select', fetchOptions: fetchProjectOptions },
  { name: 'status', label: 'Status', type: 'select', isMulti: true, options: statusOptions },
  { name: 'severity', label: 'Severity', type: 'select', isMulti: true, options: severityOptions },
  { name: 'priority', label: 'Priority', type: 'select', isMulti: true, options: priorityOptions },
  { name: 'category', label: 'Category', type: 'select', isMulti: true, options: categoryOptions },
  { name: 'resolution', label: 'Resolution', type: 'select', isMulti: true, options: resolutionOptions },
  { name: 'reporter_id', label: 'Reporter', type: 'select', fetchOptions: fetchUserOptions },
  {
    name: 'handler_id',
    label: 'Assigned To',
    type: 'select',
    fetchOptions: () => fetchUserOptions().then(options => [{ value: 'none', label: '[none] - Unassigned' }, ...options])
  },
  { name: 'due_date', label: 'Due Date', type: 'date-range' }
]

// A strip of the Mantis status color down each row's left edge.
const conditionalRowStyles = Object.entries(statusBgColors).map(([status, color]) => ({
  when: row => row.status === status,
  style: { boxShadow: `inset 4px 0 0 ${color}` }
}))

const IssuesTable = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.todo)

  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('updated_at')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  // Mantis hides closed issues by default.
  const [hideClosed, setHideClosed] = useState(true)
  const [filters, setFilters] = useState({})
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const debouncedSearchTerm = useDebounce(searchTerm, 400)

  useClampPage({ data: store.data, total: store.total, currentPage, rowsPerPage, setCurrentPage })

  useEffect(() => {
    setLoading(true)
    dispatch(
      getData({
        sort,
        sortColumn,
        q: debouncedSearchTerm,
        page: currentPage,
        perPage: rowsPerPage,
        filters: { ...filters, hide_closed: hideClosed && !filters.status ? 1 : undefined }
      })
    ).finally(() => setLoading(false))
  }, [dispatch, sort, sortColumn, currentPage, rowsPerPage, debouncedSearchTerm, filters, hideClosed])

  const handleSort = (column, direction) => {
    setSort(direction)
    setSortColumn(column.sortField)
  }

  const CustomPagination = () => (
    <ReactPaginate
      previousLabel=''
      nextLabel=''
      pageCount={Math.ceil(store.total / rowsPerPage) || 1}
      activeClassName='active'
      forcePage={currentPage - 1}
      onPageChange={page => setCurrentPage(page.selected + 1)}
      pageClassName='page-item'
      nextLinkClassName='page-link'
      nextClassName='page-item next'
      previousClassName='page-item prev'
      previousLinkClassName='page-link'
      pageLinkClassName='page-link'
      containerClassName='pagination react-paginate justify-content-end my-2 pe-1'
    />
  )

  const isFiltered = Boolean(searchTerm) || hasActiveFilters(filters)

  return (
    <Fragment>
      <Button id='navbar-advanced-search-trigger' className='d-none' onClick={() => setAdvancedSearchOpen(true)} />
      <AdvancedSearchModal
        isOpen={advancedSearchOpen}
        toggle={() => setAdvancedSearchOpen(!advancedSearchOpen)}
        title='Filter Issues'
        fields={searchFields}
        values={filters}
        onApply={newFilters => {
          setFilters(newFilters)
          setCurrentPage(1)
        }}
        onClear={() => {
          setFilters({})
          setCurrentPage(1)
        }}
      />
      <Card>
        <div className='w-100 px-1 pt-1 pb-75'>
          <Row className='g-1 align-items-center'>
            <Col md='6' className='d-flex align-items-center flex-wrap' style={{ gap: '1rem' }}>
              <div className='d-flex align-items-center'>
                <Label for='issues-per-page' className='mb-0'>
                  Show
                </Label>
                <Input
                  id='issues-per-page'
                  type='select'
                  className='mx-50'
                  style={{ width: '5rem' }}
                  value={rowsPerPage}
                  onChange={e => {
                    setRowsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                >
                  <option value='25'>25</option>
                  <option value='50'>50</option>
                  <option value='100'>100</option>
                </Input>
              </div>
              <div className='form-check mb-0'>
                <Input
                  id='issues-hide-closed'
                  type='checkbox'
                  checked={hideClosed}
                  disabled={Boolean(filters.status)}
                  onChange={e => {
                    setHideClosed(e.target.checked)
                    setCurrentPage(1)
                  }}
                />
                <Label for='issues-hide-closed' className='form-check-label'>
                  Hide closed
                </Label>
              </div>
              <span className='text-muted small'>
                {store.total} issue{store.total === 1 ? '' : 's'}
              </span>
            </Col>
            <Col md='6' className='d-flex justify-content-md-end'>
              <Input
                type='text'
                placeholder='Search summary or #id'
                style={{ maxWidth: 280 }}
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </Col>
          </Row>
        </div>
        {loading && store.data.length === 0 ? (
          <TableRowsSkeleton rows={8} columns={[8, 34, 10, 10, 10, 14, 8, 8]} />
        ) : (
          <UILoader blocking={loading} overlayColor='transparent' className='react-dataTable'>
            <DataTable
              noHeader
              sortServer
              pagination
              responsive
              paginationServer
              columns={columns}
              data={store.data}
              onSort={handleSort}
              sortIcon={<ChevronDown />}
              className='react-dataTable'
              paginationComponent={CustomPagination}
              conditionalRowStyles={conditionalRowStyles}
              noDataComponent={
                <TableEmptyState
                  icon={EmptyIcon}
                  noun='issues'
                  message='Report an issue to start tracking it here.'
                  filtered={isFiltered}
                />
              }
            />
          </UILoader>
        )}
      </Card>
    </Fragment>
  )
}

export default IssuesTable
