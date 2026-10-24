import { Fragment, useState, useEffect } from 'react'
import useClampPage from '@hooks/useClampPage'
import useDebounce from '@hooks/useDebounce'
import AdvancedSearchModal from '../../shared/AdvancedSearchModal'
import { expenseCategoryOptions } from '../expenseCategoryOptions'
import { columns } from './columns'
import { getAllData, getData, isFlatListing } from '../store'
import SeriesRows from './SeriesRows'
import { useDispatch, useSelector } from 'react-redux'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ChevronDown } from 'react-feather'
import { Row, Col, Card, Input, Button } from 'reactstrap'
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import TableEmptyState, { hasActiveFilters } from '@src/views/apps/shared/TableEmptyState'
import UILoader from '@components/ui-loader'
import TableRowsSkeleton from '@components/skeleton/TableRowsSkeleton'
import { DollarSign as EmptyIcon } from 'react-feather'
import axios from 'axios'
import { sortOptions, clientOptionLabel } from '@utils'

const searchFields = [
  { name: 'category', label: 'Category', type: 'select', options: expenseCategoryOptions },
  {
    name: 'expense_type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'one_time', label: 'One-time' },
      { value: 'subscription', label: 'Subscription' },
      { value: 'emi', label: 'EMI' }
    ]
  },
  {
    name: 'recurrence',
    label: 'Repeat',
    type: 'select',
    options: [
      { value: 'none', label: "Doesn't repeat" },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'yearly', label: 'Yearly' }
    ]
  },
  {
    name: 'vendor_id',
    label: 'Vendor',
    type: 'select',
    fetchOptions: () =>
      axios.get('/vendors', { params: { perPage: 100 } }).then(r => sortOptions(r.data.data.vendors.map(v => ({ value: v.id, label: v.name }))))
  },
  {
    name: 'client_id',
    label: 'Client',
    type: 'select',
    fetchOptions: () =>
      axios.get('/clients', { params: { perPage: 100 } }).then(r => sortOptions(r.data.data.clients.map(c => ({ value: c.id, label: clientOptionLabel(c) }))))
  },
  {
    name: 'project_id',
    label: 'Project',
    type: 'select',
    fetchOptions: () =>
      axios.get('/projects', { params: { perPage: 100 } }).then(r => sortOptions(r.data.data.projects.map(p => ({ value: p.id, label: p.name }))))
  },
  {
    name: 'payment_method_id',
    label: 'Payment Method',
    type: 'select',
    fetchOptions: () =>
      axios
        .get('/payment-methods', { params: { perPage: 100 } })
        .then(r => sortOptions(r.data.data.paymentMethods.map(m => ({ value: m.id, label: m.name }))))
  },
  {
    name: 'currency',
    label: 'Currency',
    type: 'select',
    fetchOptions: () =>
      axios
        .get('/currencies', { params: { perPage: 100 } })
        .then(r => sortOptions(r.data.data.currencies.filter(c => c.is_active).map(c => ({ value: c.icon, label: `${c.name} (${c.icon})` }))))
  },
  { name: 'expense_date', label: 'Expense Date', type: 'date-range' },
  { name: 'amount', label: 'Amount', type: 'number-range' }
]

const CustomHeader = ({ handlePerPage, rowsPerPage, handleFilter, searchTerm }) => {
  return (
    <div className='invoice-list-table-header w-100 me-1 ms-50 mt-1 mb-75'>
      <Row>
        <Col xl='6' className='d-flex align-items-center p-0'>
          <div className='d-flex align-items-center w-100'>
            <label htmlFor='rows-per-page'>Show</label>
            <Input
              className='mx-50'
              type='select'
              id='rows-per-page'
              value={rowsPerPage}
              onChange={handlePerPage}
              style={{ width: '5rem' }}
            >
              <option value='10'>10</option>
              <option value='25'>25</option>
              <option value='50'>50</option>
            </Input>
            <label htmlFor='rows-per-page'>Entries</label>
          </div>
        </Col>
        <Col
          xl='6'
          className='d-flex align-items-sm-center justify-content-xl-end justify-content-start flex-xl-nowrap flex-wrap flex-sm-row flex-column  p-0 mt-xl-0 mt-1'
        >
          <div className='d-flex align-items-center mb-sm-0 mb-1'>
            <Input
              id='search-expense'
              className='w-100'
              type='text'
              placeholder='Search'
              value={searchTerm}
              onChange={e => handleFilter(e.target.value)}
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}

const ExpensesList = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.expenses)

  const [sort, setSort] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState('id')
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(true)

  const debouncedSearchTerm = useDebounce(searchTerm, 400)

  useClampPage({ data: store.data, total: store.total, currentPage, rowsPerPage, setCurrentPage })

  useEffect(() => {
    setLoading(true)
    dispatch(getAllData())
    dispatch(
      getData({
        sort,
        sortColumn,
        q: debouncedSearchTerm,
        page: currentPage,
        perPage: rowsPerPage,
        filters
      })
    ).finally(() => setLoading(false))
  }, [dispatch, sort, sortColumn, currentPage, debouncedSearchTerm, filters])

  const handlePagination = page => {
    dispatch(
      getData({
        sort,
        sortColumn,
        q: searchTerm,
        perPage: rowsPerPage,
        page: page.selected + 1,
        filters
      })
    )
    setCurrentPage(page.selected + 1)
  }

  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    dispatch(
      getData({
        sort,
        sortColumn,
        q: searchTerm,
        perPage: value,
        page: currentPage,
        filters
      })
    )
    setRowsPerPage(value)
  }

  const handleFilter = val => {
    setSearchTerm(val)
    setCurrentPage(1)
  }

  const handleApplyFilters = newFilters => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const CustomPagination = () => {
    const count = Number(Math.ceil(store.total / rowsPerPage))

    return (
      <ReactPaginate
        previousLabel={''}
        nextLabel={''}
        pageCount={count || 1}
        activeClassName='active'
        forcePage={currentPage !== 0 ? currentPage - 1 : 0}
        onPageChange={page => handlePagination(page)}
        pageClassName={'page-item'}
        nextLinkClassName={'page-link'}
        nextClassName={'page-item next'}
        previousClassName={'page-item prev'}
        previousLinkClassName={'page-link'}
        pageLinkClassName={'page-link'}
        containerClassName={'pagination react-paginate justify-content-end my-2 pe-1'}
      />
    )
  }

  const dataToRender = () => {
    const isFiltered = searchTerm.length > 0 || Object.keys(filters).length > 0

    if (store.data.length > 0) {
      return store.data
    } else if (store.data.length === 0 && isFiltered) {
      return []
    } else {
      return store.allData.slice(0, rowsPerPage)
    }
  }

  const handleSort = (column, sortDirection) => {
    setSort(sortDirection)
    setSortColumn(column.sortField)
  }

  return (
    <Fragment>
      <Button id='navbar-advanced-search-trigger' className='d-none' onClick={() => setAdvancedSearchOpen(true)} />
      <AdvancedSearchModal
        isOpen={advancedSearchOpen}
        toggle={() => setAdvancedSearchOpen(!advancedSearchOpen)}
        fields={searchFields}
        values={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
      <Card>
        {loading && dataToRender().length === 0 ? (
          <TableRowsSkeleton rows={8} />
        ) : (
          <UILoader blocking={loading} overlayColor='transparent' className='react-dataTable'>
            <DataTable
              noDataComponent={<TableEmptyState icon={EmptyIcon} noun='expenses' message='Log a cost to track it against revenue.' filtered={Boolean(searchTerm) || hasActiveFilters(filters)} />}
              noHeader
              subHeader
              sortServer
              pagination
              responsive
              paginationServer
              columns={columns}
              expandableRows
              expandableRowsComponent={SeriesRows}
              expandableRowDisabled={row => isFlatListing(filters) || Boolean(row.recurring_parent_id) || !row.copy_count}
              onSort={handleSort}
              sortIcon={<ChevronDown />}
              className='react-dataTable'
              paginationComponent={CustomPagination}
              data={dataToRender()}
              customStyles={{ rows: { style: { opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' } } }}
              subHeaderComponent={
                <CustomHeader
                  searchTerm={searchTerm}
                  rowsPerPage={rowsPerPage}
                  handleFilter={handleFilter}
                  handlePerPage={handlePerPage}
                />
              }
            />
          </UILoader>
        )}
      </Card>
    </Fragment>
  )
}

export default ExpensesList
