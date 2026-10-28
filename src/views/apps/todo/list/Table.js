import { Fragment, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ChevronDown, Plus, CheckSquare as EmptyIcon } from 'react-feather'
import { Link } from 'react-router-dom'
import { currentUserCan } from '@src/utility/navPermissions'
import { Card, Button } from 'reactstrap'
import useClampPage from '@hooks/useClampPage'
import useDebounce from '@hooks/useDebounce'
import UILoader from '@components/ui-loader'
import TableRowsSkeleton from '@components/skeleton/TableRowsSkeleton'
import AdvancedSearchModal from '../../shared/AdvancedSearchModal'
import TableEmptyState, { hasActiveFilters } from '../../shared/TableEmptyState'
import { columns } from './columns'
import ListHeader from '../ListHeader'
import { getData } from '../store'
import { fetchUserOptions, fetchProjectOptions } from '../pickerOptions'
import { StatusOptionLabel, PriorityBadge, SeverityBadge } from '../IssueBits'
import { UserOption } from '../userSelectParts'
import {
  statusOptions,
  severityOptions,
  priorityOptions,
  categoryOptions,
  resolutionOptions
} from '../todoOptions'
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'

const searchFields = [
  { name: 'project_id', label: 'Project', type: 'select', isMulti: true, fetchOptions: fetchProjectOptions },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    isMulti: true,
    options: statusOptions,
    formatOptionLabel: o => <StatusOptionLabel status={o.value} />
  },
  {
    name: 'severity',
    label: 'Severity',
    type: 'select',
    isMulti: true,
    options: severityOptions,
    formatOptionLabel: o => <SeverityBadge severity={o.value} />
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'select',
    isMulti: true,
    options: priorityOptions,
    formatOptionLabel: o => <PriorityBadge priority={o.value} />
  },
  { name: 'category', label: 'Category', type: 'select', isMulti: true, options: categoryOptions },
  { name: 'resolution', label: 'Resolution', type: 'select', isMulti: true, options: resolutionOptions },
  { name: 'reporter_id', label: 'Reporter', type: 'select', fetchOptions: fetchUserOptions, components: { Option: UserOption } },
  {
    name: 'handler_id',
    label: 'Assigned To',
    type: 'select',
    fetchOptions: () => fetchUserOptions().then(options => [{ value: 'none', label: '[none] - Unassigned' }, ...options]),
    components: { Option: UserOption }
  },
  { name: 'due_date', label: 'Due Date', type: 'date-range' },
  { name: 'show_closed', label: 'Closed Issues', type: 'select', options: [{ value: '1', label: 'Show closed issues' }] }
]


const IssuesTable = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.todo)

  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('updated_at')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
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
        // Closed issues stay hidden (like Mantis) unless the filter asks for them
        // or a status filter is picking statuses itself.
        filters: { ...filters, hide_closed: filters.show_closed !== '1' && !filters.status?.length ? 1 : undefined }
      })
    ).finally(() => setLoading(false))
  }, [dispatch, sort, sortColumn, currentPage, rowsPerPage, debouncedSearchTerm, filters])

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
        {loading && store.data.length === 0 ? (
          <TableRowsSkeleton rows={8} columns={[8, 34, 14, 10, 10, 10, 8]} />
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
              subHeader
              subHeaderComponent={
                <ListHeader
                  id='issues'
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
              noDataComponent={
                <TableEmptyState
                  spacious
                  icon={EmptyIcon}
                  noun='tasks'
                  message='Bugs, features and to-dos you report or get assigned will show up here.'
                  filtered={isFiltered}
                  action={
                    currentUserCan('/todo/add', 'add') && (
                      <Button tag={Link} to='/todo/add' color='primary'>
                        <Plus size={14} className='me-50' />
                        Report Issue
                      </Button>
                    )
                  }
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
