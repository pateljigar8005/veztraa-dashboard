import { Fragment, useState, useEffect } from 'react'
import useClampPage from '@hooks/useClampPage'
import { columns } from './columns'
import { getData } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ChevronDown, DollarSign } from 'react-feather'
import { Row, Col, Card, Input, Button, CardHeader, CardTitle } from 'reactstrap'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import TableEmptyState from '@src/views/apps/shared/TableEmptyState'
import TableRowsSkeleton from '@components/skeleton/TableRowsSkeleton'
import GeneratePayrollModal from './GeneratePayrollModal'

const CustomHeader = ({ handlePerPage, rowsPerPage }) => {
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
      </Row>
    </div>
  )
}

const PayrollTable = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.payroll)

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useClampPage({ data: store.data, total: store.total, currentPage, rowsPerPage, setCurrentPage })

  useEffect(() => {
    setLoading(true)
    dispatch(getData({ page: currentPage, perPage: rowsPerPage })).finally(() => setLoading(false))
  }, [dispatch, currentPage, rowsPerPage])

  const handlePagination = page => {
    dispatch(getData({ perPage: rowsPerPage, page: page.selected + 1 }))
    setCurrentPage(page.selected + 1)
  }

  const handlePerPage = e => {
    const value = parseInt(e.currentTarget.value)
    dispatch(getData({ perPage: value, page: currentPage }))
    setRowsPerPage(value)
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
        <CardHeader>
          <CardTitle tag='h4'>Payroll</CardTitle>
          {/* No visible trigger - the navbar's Add icon clicks this
              (NavbarBookmarks.js's listToAddButtonId), same modal pattern
              as My Leave's "Apply for Leave". */}
          <Button id='payroll-generate-btn' className='d-none' onClick={() => setGenerateOpen(true)}>
            Generate Payroll
          </Button>
        </CardHeader>
        <div className='react-dataTable'>
          {loading ? (
            <TableRowsSkeleton rows={8} />
          ) : (
          <DataTable
            noDataComponent={
              <TableEmptyState
                icon={DollarSign}
                noun='payroll runs'
                message='Generate a month to create payslips for every active employee.'
              />
            }
            noHeader
            subHeader
            pagination
            responsive
            paginationServer
            columns={columns}
            sortIcon={<ChevronDown />}
            className='react-dataTable'
            paginationComponent={CustomPagination}
            data={store.data}
            subHeaderComponent={<CustomHeader rowsPerPage={rowsPerPage} handlePerPage={handlePerPage} />}
          />
          )}
        </div>
      </Card>
      <GeneratePayrollModal open={generateOpen} setOpen={setGenerateOpen} />
    </Fragment>
  )
}

export default PayrollTable
