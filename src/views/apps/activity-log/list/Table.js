import { Fragment, useState, useEffect } from 'react'
import useDebounce from '@hooks/useDebounce'
import { columns } from './columns'
import { getData } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ChevronDown } from 'react-feather'
import { Row, Col, Card, Input } from 'reactstrap'
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'

const formatEntityType = value =>
  (value || '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const CustomHeader = ({ handlePerPage, rowsPerPage, handleFilter, searchTerm, entityTypes, entityType, handleEntityType, action, handleAction }) => {
  return (
    <div className='invoice-list-table-header w-100 me-1 ms-50 mt-1 mb-75'>
      <Row>
        <Col xl='3' md='4' className='d-flex align-items-center p-0 mb-md-0 mb-1'>
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
        <Col xl='3' md='4' className='mb-md-0 mb-1 p-0 ps-md-1'>
          <Input type='select' value={entityType} onChange={e => handleEntityType(e.target.value)}>
            <option value=''>All Modules</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>
                {formatEntityType(type)}
              </option>
            ))}
          </Input>
        </Col>
        <Col xl='2' md='4' className='mb-md-0 mb-1 p-0 ps-md-1'>
          <Input type='select' value={action} onChange={e => handleAction(e.target.value)}>
            <option value=''>All Actions</option>
            <option value='create'>Created</option>
            <option value='update'>Updated</option>
            <option value='delete'>Deleted</option>
          </Input>
        </Col>
        <Col
          xl='4'
          className='d-flex align-items-sm-center justify-content-xl-end justify-content-start flex-xl-nowrap flex-wrap flex-sm-row flex-column p-0 ps-xl-1 mt-xl-0 mt-1'
        >
          <div className='d-flex align-items-center mb-sm-0 mb-1 w-100'>
            <Input
              id='search-activity-log'
              className='w-100'
              type='text'
              placeholder='Search by record or user name'
              value={searchTerm}
              onChange={e => handleFilter(e.target.value)}
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}

const ActivityLogList = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.activityLogs)

  const [sort, setSort] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState('created_at')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')

  const debouncedSearchTerm = useDebounce(searchTerm, 400)

  useEffect(() => {
    dispatch(
      getData({
        sort,
        sortColumn,
        q: debouncedSearchTerm,
        page: currentPage,
        perPage: rowsPerPage,
        entityType,
        action
      })
    )
  }, [dispatch, sort, sortColumn, currentPage, rowsPerPage, debouncedSearchTerm, entityType, action])

  const handlePagination = page => setCurrentPage(page.selected + 1)

  const handlePerPage = e => {
    setRowsPerPage(parseInt(e.currentTarget.value))
    setCurrentPage(1)
  }

  const handleFilter = val => {
    setSearchTerm(val)
    setCurrentPage(1)
  }

  const handleEntityType = val => {
    setEntityType(val)
    setCurrentPage(1)
  }

  const handleAction = val => {
    setAction(val)
    setCurrentPage(1)
  }

  const handleSort = (column, sortDirection) => {
    setSort(sortDirection)
    setSortColumn(column.sortField)
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

  return (
    <Fragment>
      <Card>
        <div className='react-dataTable'>
          <DataTable
            noHeader
            subHeader
            sortServer
            pagination
            responsive
            paginationServer
            columns={columns}
            onSort={handleSort}
            defaultSortField='created_at'
            defaultSortAsc={false}
            sortIcon={<ChevronDown />}
            className='react-dataTable'
            paginationComponent={CustomPagination}
            data={store.data}
            subHeaderComponent={
              <CustomHeader
                searchTerm={searchTerm}
                rowsPerPage={rowsPerPage}
                handleFilter={handleFilter}
                handlePerPage={handlePerPage}
                entityTypes={store.entityTypes}
                entityType={entityType}
                handleEntityType={handleEntityType}
                action={action}
                handleAction={handleAction}
              />
            }
          />
        </div>
      </Card>
    </Fragment>
  )
}

export default ActivityLogList
