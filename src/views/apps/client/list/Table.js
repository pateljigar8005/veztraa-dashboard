import { Fragment, useState, useEffect } from 'react'
import useClampPage from '@hooks/useClampPage'
import useDebounce from '@hooks/useDebounce'
import AdvancedSearchModal from '../../shared/AdvancedSearchModal'
import axios from 'axios'
import { columns } from './columns'
import { getAllData, getData } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ChevronDown } from 'react-feather'
import { Row, Col, Card, Input, Button } from 'reactstrap'
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import TableEmptyState, { hasActiveFilters } from '@src/views/apps/shared/TableEmptyState'
import { Briefcase as EmptyIcon } from 'react-feather'


const searchFields = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: '1', label: 'Active' },
      { value: '0', label: 'Inactive' }
    ]
  },
  {
    name: 'industry_id',
    label: 'Industry',
    type: 'select',
    fetchOptions: () =>
      axios
        .get('/industries', { params: { perPage: 100 } })
        .then(r => r.data.data.industries.filter(i => i.is_active).map(i => ({ value: i.id, label: i.name })))
  },
  {
    name: 'currency_id',
    label: 'Currency',
    type: 'select',
    fetchOptions: () =>
      axios
        .get('/currencies', { params: { perPage: 100 } })
        .then(r => r.data.data.currencies.filter(c => c.is_active).map(c => ({ value: c.id, label: `${c.name} (${c.icon})` })))
  }
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
              id='search-client'
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

const ClientsList = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.clients)

  const [sort, setSort] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState('id')
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const [filters, setFilters] = useState({})

  const debouncedSearchTerm = useDebounce(searchTerm, 400)

  useClampPage({ data: store.data, total: store.total, currentPage, rowsPerPage, setCurrentPage })

  useEffect(() => {
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
    )
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
        <div className='react-dataTable'>
          <DataTable
            noDataComponent={<TableEmptyState icon={EmptyIcon} noun='clients' message='Add your first client to start sending quotations, contracts and invoices.' filtered={Boolean(searchTerm) || hasActiveFilters(filters)} />}
            noHeader
            subHeader
            sortServer
            pagination
            responsive
            paginationServer
            columns={columns}
            onSort={handleSort}
            sortIcon={<ChevronDown />}
            className='react-dataTable'
            paginationComponent={CustomPagination}
            data={dataToRender()}
            subHeaderComponent={
              <CustomHeader
                searchTerm={searchTerm}
                rowsPerPage={rowsPerPage}
                handleFilter={handleFilter}
                handlePerPage={handlePerPage}
              />
            }
          />
        </div>
      </Card>
    </Fragment>
  )
}

export default ClientsList