import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ArrowLeft, Trash2 } from 'react-feather'
import { Card, CardHeader, CardTitle, Button, Badge } from 'reactstrap'
import { getApiKeyLogs, clearApiKeyLogs } from '../store'
import { formatDate } from '@utils'
import { confirmDelete } from '@src/utility/confirmDelete'
import { currentUserCan } from '@src/utility/navPermissions'
import '@styles/react/libs/tables/react-dataTable-component.scss'

const statusColor = code => {
  if (code >= 500) return 'light-danger'
  if (code >= 400) return 'light-warning'
  return 'light-success'
}

const columns = [
  {
    name: 'Endpoint',
    minWidth: '260px',
    selector: row => row.endpoint,
    cell: row => <span className='font-monospace'>{row.endpoint}</span>
  },
  {
    name: 'Method',
    minWidth: '100px',
    selector: row => row.method
  },
  {
    name: 'IP Address',
    minWidth: '150px',
    selector: row => row.ip_address,
    cell: row => <span>{row.ip_address || '-'}</span>
  },
  {
    name: 'Response',
    minWidth: '120px',
    selector: row => row.response_code,
    cell: row => (
      <Badge color={statusColor(row.response_code)} pill>
        {row.response_code}
      </Badge>
    )
  },
  {
    name: 'When',
    minWidth: '180px',
    selector: row => row.created_at,
    cell: row => <span>{formatDate(row.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
  }
]

const ApiKeyAccessHistory = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.apiKeys)

  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 20

  useEffect(() => {
    dispatch(getApiKeyLogs({ id: Number(id), page: currentPage, perPage: rowsPerPage }))
  }, [dispatch, id, currentPage])

  const handlePagination = page => setCurrentPage(page.selected + 1)

  const CustomPagination = () => {
    const count = Number(Math.ceil(store.logs.total / rowsPerPage))
    return (
      <ReactPaginate
        previousLabel={''}
        nextLabel={''}
        pageCount={count || 1}
        activeClassName='active'
        forcePage={currentPage - 1}
        onPageChange={handlePagination}
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

  const logs = store.logs.id === Number(id) ? store.logs.data : []

  const handleClearLogs = () => {
    confirmDelete({
      title: 'Clear access history?',
      text: 'This will permanently delete every logged request for this API key.',
      confirmButtonText: 'Yes, clear it!',
      onConfirm: () =>
        dispatch(clearApiKeyLogs(id))
          .unwrap()
          .then(() => {
            toast.success('Access history cleared')
            setCurrentPage(1)
            dispatch(getApiKeyLogs({ id: Number(id), page: 1, perPage: rowsPerPage }))
          })
          .catch(err => toast.error(err?.message || 'Failed to clear access history'))
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>Access History</CardTitle>
        <div>
          {currentUserCan('/api-key', 'delete') && logs.length > 0 && (
            <Button color='flat-danger' className='me-1' onClick={handleClearLogs}>
              <Trash2 size={14} className='me-50' /> Clear Logs
            </Button>
          )}
          <Button color='flat-secondary' onClick={() => navigate('/api-key')}>
            <ArrowLeft size={14} className='me-50' /> Back to API Keys
          </Button>
        </div>
      </CardHeader>
      <div className='react-dataTable'>
        <DataTable
          noHeader
          pagination
          responsive
          paginationServer
          columns={columns}
          className='react-dataTable'
          paginationComponent={CustomPagination}
          data={logs}
          noDataComponent={<div className='p-2'>No requests logged yet for this key.</div>}
        />
      </div>
    </Card>
  )
}

export default ApiKeyAccessHistory
