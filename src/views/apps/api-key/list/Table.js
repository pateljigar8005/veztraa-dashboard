import { Fragment, useState, useEffect } from 'react'
import { columns } from './columns'
import { getAllData } from '../store'
import CreateApiKeyModal from '../CreateApiKeyModal'
import { useDispatch, useSelector } from 'react-redux'
import DataTable from 'react-data-table-component'
import { ChevronDown } from 'react-feather'
import { Row, Col, Card, Input, Button } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import TableEmptyState from '@src/views/apps/shared/TableEmptyState'
import { Key as EmptyIcon } from 'react-feather'

const CustomHeader = ({ rowsPerPage, handlePerPage, searchTerm, handleFilter, onCreate, canCreate }) => {
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
              id='search-api-key'
              className='w-100'
              type='text'
              placeholder='Search'
              value={searchTerm}
              onChange={e => handleFilter(e.target.value)}
            />
            {/* No visible trigger - the navbar's Add icon clicks this
                (NavbarBookmarks.js's listToAddButtonId), since creating a
                key is a modal here rather than an /api-key/add page. */}
            {canCreate && (
              <Button id='api-key-create-btn' className='d-none' onClick={onCreate}>
                Create API Key
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </div>
  )
}

const ApiKeysTable = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.apiKeys)

  const [searchTerm, setSearchTerm] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    dispatch(getAllData())
  }, [dispatch])

  const handlePerPage = e => setRowsPerPage(parseInt(e.currentTarget.value))
  const handleFilter = val => setSearchTerm(val)

  const dataToRender = () => {
    if (!searchTerm) return store.allData
    const term = searchTerm.toLowerCase()
    return store.allData.filter(key => key.name.toLowerCase().includes(term) || key.token_hint?.toLowerCase().includes(term))
  }

  return (
    <Fragment>
      <CreateApiKeyModal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} />
      <Card>
        <div className='react-dataTable'>
          <DataTable
            noDataComponent={<TableEmptyState icon={EmptyIcon} noun='API keys' message='Create an API key to let your website read and submit data.' filtered={Boolean(searchTerm)} />}
            noHeader
            subHeader
            pagination
            responsive
            columns={columns}
            paginationPerPage={rowsPerPage}
            sortIcon={<ChevronDown />}
            className='react-dataTable'
            data={dataToRender()}
            subHeaderComponent={
              <CustomHeader
                rowsPerPage={rowsPerPage}
                handlePerPage={handlePerPage}
                searchTerm={searchTerm}
                handleFilter={handleFilter}
                onCreate={() => setModalOpen(true)}
                canCreate={currentUserCan('/api-key', 'add')}
              />
            }
          />
        </div>
      </Card>
    </Fragment>
  )
}

export default ApiKeysTable
