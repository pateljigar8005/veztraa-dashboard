import { Fragment, useState, useEffect, forwardRef } from 'react'
import useClampPage from '@hooks/useClampPage'
import useDebounce from '@hooks/useDebounce'
import axios from 'axios'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { columns } from './columns'
import { formatEntityType, describeActivityRow } from '@src/utility/activityLogFormat'
import { formatDate } from '@utils'
import { getData, bulkDeleteActivityLogs, setSelectedIds } from '../store'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import { useDispatch, useSelector } from 'react-redux'
import ReactPaginate from 'react-paginate'
import DataTable from 'react-data-table-component'
import { ChevronDown } from 'react-feather'
import { Row, Col, Card, Input, Button } from 'reactstrap'
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import TableEmptyState from '@src/views/apps/shared/TableEmptyState'
import { Activity as EmptyIcon } from 'react-feather'

// One exported row per log entry. The Description column's lines are
// joined with "; " rather than newlines - the community xlsx build can't
// write cell styles, so a wrapText cell isn't an option and a raw newline
// would just run the lines together in Excel.
const buildActivityLogSheet = logRows => {
  const sheet = XLSX.utils.json_to_sheet(
    logRows.map(row => {
      const { badgeLabel, lines } = describeActivityRow(row)
      return {
        'Date & Time': formatDate(row.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        User: row.user_name || 'System',
        Role: row.user_role || '',
        Module: formatEntityType(row.entity_type),
        Record: row.entity_label || '',
        Status: badgeLabel,
        Description: lines.map(line => line.bullet || [line.bold, line.muted].filter(Boolean).join(' - ')).join('; '),
        'IP Address': row.ip_address || ''
      }
    })
  )
  sheet['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 10 }, { wch: 20 }, { wch: 28 }, { wch: 10 }, { wch: 80 }, { wch: 16 }]
  return sheet
}

// react-data-table-component's selectableRowsComponent - the stock
// checkbox is unstyled, this gives it the theme's own .form-check look.
const BootstrapCheckbox = forwardRef((props, ref) => (
  <div className='form-check'>
    <Input type='checkbox' ref={ref} {...props} />
  </div>
))

const CustomHeader = ({
  handlePerPage,
  rowsPerPage,
  handleFilter,
  searchTerm,
  entityTypes,
  entityType,
  handleEntityType,
  action,
  handleAction,
  handleExport,
  exporting,
  handleBulkDelete
}) => {
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
            <option value='update'>Edited</option>
            <option value='delete'>Deleted</option>
          </Input>
        </Col>
        <Col
          xl='4'
          className='d-flex align-items-sm-center justify-content-xl-end justify-content-start flex-xl-nowrap flex-wrap flex-sm-row flex-column p-0 ps-xl-1 mt-xl-0 mt-1'
        >
          <div className='d-flex align-items-center mb-sm-0 mb-1 w-100' style={{ gap: '0.5rem' }}>
            <Input
              id='search-activity-log'
              className='w-100'
              type='text'
              placeholder='Search by record or user name'
              value={searchTerm}
              onChange={e => handleFilter(e.target.value)}
            />
            {/* Same hidden-trigger pattern for the navbar's bulk-delete
                icon, which only shows while rows are ticked. */}
            <Button id='activity-log-bulk-delete-btn' className='d-none' onClick={handleBulkDelete}>
              Delete selected
            </Button>
            {/* No visible trigger - the navbar's Download icon clicks this
                (NavbarBookmarks.js's downloadButtonIdByRoute), same hidden-
                button pattern as <module>-download-pdf-btn. Disabled while
                an export is running so a second click can't start another. */}
            <Button id='activity-log-export-btn' className='d-none' onClick={handleExport} disabled={exporting}>
              Export
            </Button>
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
  const [exporting, setExporting] = useState(false)
  const selectedIds = store.selectedIds
  // Flipping this is react-data-table-component's only way to clear its
  // own internal checkbox state from outside.
  const [clearSelectionToggle, setClearSelectionToggle] = useState(false)
  const canDelete = currentUserCan('/activity-log', 'delete')

  const debouncedSearchTerm = useDebounce(searchTerm, 400)

  useClampPage({ data: store.data, total: store.total, currentPage, rowsPerPage, setCurrentPage })

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

  // Exports everything matching the current filters/search/sort, not just
  // the page on screen - walks the same GET /activity-logs endpoint 100 rows
  // at a time (its perPage cap), same approach as the Invoice Report's
  // fetchAllPages().
  const handleExport = async () => {
    setExporting(true)
    const toastId = toast.loading('Exporting activity log...')
    try {
      let page = 1
      let all = []
      while (true) {
        const response = await axios.get('/activity-logs', {
          params: {
            page,
            perPage: 100,
            q: debouncedSearchTerm,
            sortColumn,
            sortDirection: sort,
            entity_type: entityType,
            action
          }
        })
        const { activityLogs, total } = response.data.data
        all = all.concat(activityLogs)
        if (activityLogs.length === 0 || all.length >= total) break
        page++
      }

      if (!all.length) {
        toast.error('Nothing to export', { id: toastId })
        return
      }

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, buildActivityLogSheet(all), 'Activity Log')
      // Local date parts, not toISOString() - that's UTC and can name the
      // file after tomorrow/yesterday depending on the browser's timezone.
      const now = new Date()
      const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
      XLSX.writeFile(workbook, `Activity-Log-${stamp}.xlsx`)
      toast.success(`Exported ${all.length} entr${all.length === 1 ? 'y' : 'ies'}`, { id: toastId })
    } catch (e) {
      toast.error('Failed to export activity log', { id: toastId })
    } finally {
      setExporting(false)
    }
  }

  // Selection only ever covers the rows on screen - any page/filter/sort
  // change refetches a different set, so it's cleared rather than carried
  // over to rows the user can no longer see.
  // (getData.fulfilled already empties store.selectedIds - this just
  // unticks the table's own checkboxes to match.)
  useEffect(() => {
    setClearSelectionToggle(toggle => !toggle)
  }, [store.data])

  const handleBulkDelete = () => {
    const count = selectedIds.length
    if (!count) return
    confirmDelete({
      text: `This will permanently delete ${count} activity log entr${count === 1 ? 'y' : 'ies'}.`,
      confirmButtonText: `Yes, delete ${count}!`,
      onConfirm: () =>
        dispatch(bulkDeleteActivityLogs(selectedIds))
          .unwrap()
          .then(deleted => toast.success(`${deleted} activity log entr${deleted === 1 ? 'y' : 'ies'} deleted`))
          .catch(err => toast.error(err?.message || 'Failed to delete'))
    })
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
            noDataComponent={<TableEmptyState icon={EmptyIcon} noun='activity' message='Changes made across the dashboard will be recorded here.' filtered={Boolean(searchTerm || entityType || action)} />}
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
            className='react-dataTable auto-height-rows'
            paginationComponent={CustomPagination}
            data={store.data}
            selectableRows={canDelete}
            selectableRowsComponent={BootstrapCheckbox}
            onSelectedRowsChange={({ selectedRows }) => dispatch(setSelectedIds(selectedRows.map(row => row.id)))}
            clearSelectedRows={clearSelectionToggle}
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
                handleExport={handleExport}
                exporting={exporting}
                handleBulkDelete={handleBulkDelete}
              />
            }
          />
        </div>
      </Card>
    </Fragment>
  )
}

export default ActivityLogList
