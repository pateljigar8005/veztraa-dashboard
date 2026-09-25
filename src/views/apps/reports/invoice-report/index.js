import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import Select from 'react-select'
import DataTable from 'react-data-table-component'
import { Search, RotateCcw, Download, FileText, DollarSign, CheckCircle, AlertCircle } from 'react-feather'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Label, Button, Badge, Spinner } from 'reactstrap'
import DateField from '../../shared/DateField'
import AmountField from '../../shared/AmountField'
import { invoiceStatusOptions, currencyOptions } from '../../quotation/documentOptions'
import { selectThemeColors, formatAmount, sortOptions } from '@utils'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import TableEmptyState from '@src/views/apps/shared/TableEmptyState'
import { FileText as EmptyIcon } from 'react-feather'

const statusColorObj = {
  draft: 'light-secondary',
  sent: 'light-info',
  paid: 'light-success',
  partial: 'light-warning',
  overdue: 'light-danger'
}

const defaultFilters = {
  issue_date_from: '',
  issue_date_to: '',
  due_date_from: '',
  due_date_to: '',
  total_from: '',
  total_to: '',
  statuses: [],
  clients: [],
  currencies: []
}

const columns = [
  {
    name: 'Invoice #',
    minWidth: '140px',
    sortable: true,
    selector: row => row.invoice_number
  },
  {
    name: 'Client',
    minWidth: '200px',
    selector: row => row.company_name || row.contact_name,
    cell: row => (
      <div>
        <div className='fw-bolder'>{row.company_name || row.contact_name}</div>
        {row.company_name && <div className='text-muted small'>{row.contact_name}</div>}
      </div>
    )
  },
  { name: 'Issue Date', minWidth: '130px', sortable: true, selector: row => row.issue_date },
  { name: 'Due Date', minWidth: '130px', sortable: true, selector: row => row.due_date },
  {
    name: 'Status',
    minWidth: '120px',
    selector: row => row.status,
    cell: row => (
      <Badge className='text-capitalize' color={statusColorObj[row.status] || 'light-secondary'} pill>
        {row.status}
      </Badge>
    )
  },
  {
    name: 'Total',
    minWidth: '130px',
    right: true,
    sortable: true,
    selector: row => Number(row.total),
    cell: row => (
      <span>
        {row.currency} {formatAmount(row.total)}
      </span>
    )
  },
  {
    name: 'Paid',
    minWidth: '130px',
    right: true,
    selector: row => Number(row.paid_amount),
    cell: row => (
      <span className='text-success'>
        {row.currency} {formatAmount(row.paid_amount)}
      </span>
    )
  },
  {
    name: 'Balance Due',
    minWidth: '140px',
    right: true,
    selector: row => Number(row.balance_due),
    cell: row => (
      <span className={row.balance_due > 0 ? 'fw-bolder text-danger' : 'text-muted'}>
        {row.currency} {formatAmount(row.balance_due)}
      </span>
    )
  }
]

const buildInvoiceSheet = invoiceRows => {
  const sheet = XLSX.utils.json_to_sheet(
    invoiceRows.map(r => ({
      'Invoice #': r.invoice_number,
      Client: r.company_name || r.contact_name,
      Contact: r.contact_name,
      Email: r.email,
      Status: r.status,
      Currency: r.currency,
      'Issue Date': r.issue_date,
      'Due Date': r.due_date,
      Subtotal: Number(r.subtotal),
      Tax: Number(r.tax_amount),
      Discount: Number(r.discount_amount),
      Total: Number(r.total),
      Paid: Number(r.paid_amount),
      'Balance Due': Number(r.balance_due)
    }))
  )
  sheet['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 26 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 }
  ]
  return sheet
}

const StatCard = ({ icon: Icon, color, label, value }) => (
  <Col md={3} sm={6} className='mb-1'>
    <Card className='mb-0'>
      <CardBody className='d-flex align-items-center'>
        <div className={`avatar avatar-stats p-50 m-0 me-2 bg-light-${color}`}>
          <div className='avatar-content'>
            <Icon size={22} />
          </div>
        </div>
        <div>
          <h4 className='fw-bolder mb-0'>{value}</h4>
          <p className='card-text text-muted mb-0'>{label}</p>
        </div>
      </CardBody>
    </Card>
  </Col>
)

const InvoiceReport = () => {
  const [filters, setFilters] = useState(defaultFilters)
  const [clientOptions, setClientOptions] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  useEffect(() => {
    axios
      .get('/clients', { params: { perPage: 100 } })
      .then(response => setClientOptions(sortOptions(response.data.data.clients.map(c => ({ value: c.id, label: c.fullName })))))
      .catch(() => {})
  }, [])

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  const buildParams = () => {
    const params = {}
    if (filters.issue_date_from) params.issue_date_from = filters.issue_date_from
    if (filters.issue_date_to) params.issue_date_to = filters.issue_date_to
    if (filters.due_date_from) params.due_date_from = filters.due_date_from
    if (filters.due_date_to) params.due_date_to = filters.due_date_to
    if (filters.total_from) params.total_from = filters.total_from
    if (filters.total_to) params.total_to = filters.total_to
    return params
  }

  const fetchAllPages = async params => {
    let page = 1
    let all = []
    while (true) {
      const response = await axios.get('/invoices', { params: { ...params, page, perPage: 100 } })
      const { invoices, total } = response.data.data
      all = all.concat(invoices)
      if (invoices.length === 0 || all.length >= total) break
      page++
    }
    return all
  }

  const dimensionValues = (selected, key) => (selected.length ? selected.map(o => ({ [key]: o.value })) : [{}])

  const fetchAllMatching = async () => {
    const baseParams = buildParams()
    const clientCombos = dimensionValues(filters.clients, 'client_id')
    const statusCombos = dimensionValues(filters.statuses, 'status')
    const currencyCombos = dimensionValues(filters.currencies, 'currency')

    const requests = []
    for (const c of clientCombos) {
      for (const s of statusCombos) {
        for (const cur of currencyCombos) {
          requests.push(fetchAllPages({ ...baseParams, ...c, ...s, ...cur }))
        }
      }
    }

    const results = await Promise.all(requests)
    return results.flat()
  }

  const handleRun = () => {
    setLoading(true)
    fetchAllMatching()
      .then(all => {
        setRows(all)
        setHasRun(true)
      })
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false))
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    setRows([])
    setHasRun(false)
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += Number(r.total) || 0
      acc.paid += Number(r.paid_amount) || 0
      acc.due += Number(r.balance_due) || 0
      return acc
    },
    { total: 0, paid: 0, due: 0 }
  )

  const handleExport = () => {
    if (!rows.length) {
      toast.error('Nothing to export - run the report first')
      return
    }

    setExporting(true)
    try {
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ['Invoice Report'],
        ['Generated', new Date().toLocaleString()],
        [],
        ['Filters Applied'],
        ['Issue Date From', filters.issue_date_from || 'Any'],
        ['Issue Date To', filters.issue_date_to || 'Any'],
        ['Due Date From', filters.due_date_from || 'Any'],
        ['Due Date To', filters.due_date_to || 'Any'],
        ['Statuses', filters.statuses.length ? filters.statuses.map(s => s.label).join(', ') : 'Any'],
        ['Clients', filters.clients.length ? filters.clients.map(c => c.label).join(', ') : 'Any'],
        ['Currencies', filters.currencies.length ? filters.currencies.map(c => c.label).join(', ') : 'Any'],
        ['Total Amount From', filters.total_from || 'Any'],
        ['Total Amount To', filters.total_to || 'Any'],
        [],
        ['Summary'],
        ['Total Invoices', rows.length],
        ['Total Amount', totals.total.toFixed(2)],
        ['Total Paid', totals.paid.toFixed(2)],
        ['Total Balance Due', totals.due.toFixed(2)]
      ])
      summarySheet['!cols'] = [{ wch: 22 }, { wch: 28 }]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      XLSX.utils.book_append_sheet(workbook, buildInvoiceSheet(rows), 'Invoices')

      invoiceStatusOptions.forEach(option => {
        const statusRows = rows.filter(r => r.status === option.value)
        if (!statusRows.length) return
        const sheetName = option.label.slice(0, 31)
        XLSX.utils.book_append_sheet(workbook, buildInvoiceSheet(statusRows), sheetName)
      })

      XLSX.writeFile(workbook, `Invoice-Report-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Report exported')
    } catch (e) {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className='invoice-report'>
      <Card>
        <CardHeader className='d-flex justify-content-between align-items-center flex-wrap'>
          <CardTitle tag='h4'>Invoice Report</CardTitle>
          <div className='d-flex' style={{ gap: '0.5rem' }}>
            <Button color='secondary' outline onClick={handleReset} disabled={loading}>
              <RotateCcw size={14} className='me-50' />
              Reset
            </Button>
            <Button color='primary' onClick={handleRun} disabled={loading}>
              {loading ? <Spinner size='sm' className='me-50' /> : <Search size={14} className='me-50' />}
              Run Report
            </Button>
            <Button color='success' onClick={handleExport} disabled={exporting || !rows.length}>
              <Download size={14} className='me-50' />
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <h6 className='mb-1'>Date Range</h6>
          <Row>
            <Col md={3} className='mb-1'>
              <Label className='form-label' for='issue_date_from'>
                Issue Date From
              </Label>
              <DateField id='issue_date_from' value={filters.issue_date_from} onChange={v => setFilter('issue_date_from', v)} />
            </Col>
            <Col md={3} className='mb-1'>
              <Label className='form-label' for='issue_date_to'>
                Issue Date To
              </Label>
              <DateField id='issue_date_to' value={filters.issue_date_to} onChange={v => setFilter('issue_date_to', v)} />
            </Col>
            <Col md={3} className='mb-1'>
              <Label className='form-label' for='due_date_from'>
                Due Date From
              </Label>
              <DateField id='due_date_from' value={filters.due_date_from} onChange={v => setFilter('due_date_from', v)} />
            </Col>
            <Col md={3} className='mb-1'>
              <Label className='form-label' for='due_date_to'>
                Due Date To
              </Label>
              <DateField id='due_date_to' value={filters.due_date_to} onChange={v => setFilter('due_date_to', v)} />
            </Col>
          </Row>

          <hr />

          <h6 className='mb-1'>Client & Status</h6>
          <Row>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='clients'>
                Clients
              </Label>
              <Select
                inputId='clients'
                isMulti
                isClearable
                className='react-select'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={clientOptions}
                value={filters.clients}
                onChange={options => setFilter('clients', options || [])}
                placeholder='All clients'
              />
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='statuses'>
                Statuses
              </Label>
              <Select
                inputId='statuses'
                isMulti
                isClearable
                className='react-select'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={invoiceStatusOptions}
                value={filters.statuses}
                onChange={options => setFilter('statuses', options || [])}
                placeholder='All statuses'
              />
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='currencies'>
                Currencies
              </Label>
              <Select
                inputId='currencies'
                isMulti
                isClearable
                className='react-select'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={currencyOptions}
                value={filters.currencies}
                onChange={options => setFilter('currencies', options || [])}
                placeholder='All currencies'
              />
            </Col>
          </Row>

          <hr />

          <h6 className='mb-1'>Amount Range</h6>
          <Row>
            <Col md={3} className='mb-1'>
              <Label className='form-label' for='total_from'>
                Total Amount From
              </Label>
              <AmountField id='total_from' value={filters.total_from} onChange={v => setFilter('total_from', v)} />
            </Col>
            <Col md={3} className='mb-1'>
              <Label className='form-label' for='total_to'>
                Total Amount To
              </Label>
              <AmountField id='total_to' value={filters.total_to} onChange={v => setFilter('total_to', v)} />
            </Col>
          </Row>
        </CardBody>
      </Card>

      {hasRun && (
        <>
          <Row className='mt-1'>
            <StatCard icon={FileText} color='primary' label='Total Invoices' value={rows.length} />
            <StatCard icon={DollarSign} color='info' label='Total Amount' value={formatAmount(totals.total)} />
            <StatCard icon={CheckCircle} color='success' label='Total Paid' value={formatAmount(totals.paid)} />
            <StatCard icon={AlertCircle} color='danger' label='Total Balance Due' value={formatAmount(totals.due)} />
          </Row>

          <Card>
            <div className='react-dataTable'>
              <DataTable
                noHeader
                pagination
                responsive
                columns={columns}
                className='react-dataTable'
                data={rows}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                noDataComponent={<TableEmptyState icon={EmptyIcon} noun='invoices' filtered filteredMessage='No invoices match these report filters. Try widening the date range or clearing some filters.' />}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

export default InvoiceReport