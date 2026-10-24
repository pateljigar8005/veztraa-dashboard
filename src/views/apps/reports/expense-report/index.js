import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import Select from 'react-select'
import DataTable from 'react-data-table-component'
import ReactPaginate from 'react-paginate'
import { Search, RotateCcw, Download, DollarSign, Hash, Calendar, Repeat, PieChart } from 'react-feather'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Label, Button, Spinner, Progress, Input } from 'reactstrap'
import DateField from '../../shared/DateField'
import { formatAmount, formatDate, selectThemeColors, sortOptions, clientOptionLabel } from '@utils'
import { expenseCategoryOptions, fetchExpenseCategoryOptions } from '../../expense/expenseCategoryOptions'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import '@styles/react/libs/react-select/_react-select.scss'
import TableEmptyState from '@src/views/apps/shared/TableEmptyState'

const TYPE_OPTIONS = [
  { value: 'one_time', label: 'One-time' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'emi', label: 'EMI' }
]
const TYPE_LABELS = { one_time: 'One-time', subscription: 'Subscription', emi: 'EMI' }
const REPEAT_LABELS = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
const MONTHS_PER_PERIOD = { monthly: 1, quarterly: 3, yearly: 12 }
const LINK_OPTIONS = [
  { value: 'general', label: 'General (no client or project)' },
  { value: 'linked', label: 'Linked to a client or project' }
]

const monthLabel = ym => {
  const [year, month] = ym.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}
const shortDate = value => (value ? formatDate(`${value}T00:00:00`, { day: 'numeric', month: 'short', year: 'numeric' }) : '')

const fetchAllExpenses = async params => {
  let page = 1
  let all = []
  while (true) {
    const response = await axios.get('/expenses', { params: { ...params, page, perPage: 100 } })
    const { expenses, total } = response.data.data
    all = all.concat(expenses)
    if (expenses.length === 0 || all.length >= total) break
    page++
  }
  return all
}

// Every month from `from` to `to` (YYYY-MM), so months with no spending still
// show as zero instead of silently disappearing from the trend.
const monthRange = (from, to) => {
  const months = []
  let [y, m] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return months
}

const CustomPagination = ({ rowsPerPage, rowCount, currentPage, onChangePage }) => (
  <ReactPaginate
    previousLabel={''}
    nextLabel={''}
    pageCount={Math.ceil(rowCount / rowsPerPage) || 1}
    activeClassName='active'
    forcePage={currentPage - 1}
    onPageChange={page => onChangePage(page.selected + 1)}
    pageClassName={'page-item'}
    nextLinkClassName={'page-link'}
    nextClassName={'page-item next'}
    previousClassName={'page-item prev'}
    previousLinkClassName={'page-link'}
    pageLinkClassName={'page-link'}
    containerClassName={'pagination react-paginate justify-content-end my-2 pe-1'}
  />
)

const StatCard = ({ icon: Icon, color, label, value, hint }) => (
  <Col lg={3} sm={6} className='mb-1'>
    <Card className='mb-0 h-100'>
      <CardBody className='d-flex align-items-center'>
        <div className={`avatar avatar-stats p-50 m-0 me-2 bg-light-${color}`}>
          <div className='avatar-content'>
            <Icon size={22} />
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <h4 className='fw-bolder mb-0 text-truncate'>{value}</h4>
          <p className='card-text text-muted mb-0'>{label}</p>
          {hint && <small className='text-muted'>{hint}</small>}
        </div>
      </CardBody>
    </Card>
  </Col>
)

const ExpenseReport = () => {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [category, setCategory] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [expenseType, setExpenseType] = useState(null)
  const [client, setClient] = useState(null)
  const [project, setProject] = useState(null)
  const [linkedTo, setLinkedTo] = useState(null)

  const [categoryOptions, setCategoryOptions] = useState(expenseCategoryOptions)
  const [vendorOptions, setVendorOptions] = useState([])
  const [clientOptions, setClientOptions] = useState([])
  const [projectOptions, setProjectOptions] = useState([])

  const [loading, setLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [reportIcon, setReportIcon] = useState('')
  const [report, setReport] = useState(null)
  // Spending by Month only - narrows that table to one month (YYYY-MM),
  // independent of the report's own date range.
  const [monthFilter, setMonthFilter] = useState('')

  useEffect(() => {
    fetchExpenseCategoryOptions().then(setCategoryOptions)
    axios
      .get('/vendors', { params: { perPage: 100 } })
      .then(r => setVendorOptions(sortOptions(r.data.data.vendors.map(v => ({ value: v.id, label: v.name })))))
      .catch(() => {})
    axios
      .get('/clients', { params: { perPage: 100 } })
      .then(r => setClientOptions(sortOptions(r.data.data.clients.map(c => ({ value: c.id, label: clientOptionLabel(c) })))))
      .catch(() => {})
    axios
      .get('/projects', { params: { perPage: 100 } })
      .then(r => setProjectOptions(sortOptions(r.data.data.projects.map(p => ({ value: p.id, label: p.name })))))
      .catch(() => {})
  }, [])

  const handleReset = () => {
    setDateFrom('')
    setDateTo('')
    setCategory(null)
    setVendor(null)
    setExpenseType(null)
    setClient(null)
    setProject(null)
    setLinkedTo(null)
    setReport(null)
    setMonthFilter('')
    setHasRun(false)
  }

  const handleRun = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast.error('Date From must be before Date To')
      return
    }
    setLoading(true)
    try {
      const filters = {
        expense_date_from: dateFrom || undefined,
        expense_date_to: dateTo || undefined,
        category: category?.value,
        vendor_id: vendor?.value,
        expense_type: expenseType?.value,
        client_id: client?.value,
        project_id: project?.value
      }
      // Payments: every individual expense (never grouped) so totals are what
      // was actually spent. Series: the recurring originals, for the "what's
      // coming up" commitments table - same non-date filters, no date range.
      const [payments, seriesRows, currenciesResponse, companyResponse] = await Promise.all([
        fetchAllExpenses(filters),
        fetchAllExpenses({ ...filters, expense_date_from: undefined, expense_date_to: undefined, grouped: 1 }),
        axios.get('/currencies', { params: { perPage: 100 } }),
        axios.get('/company')
      ])

      // Same conversion as the Profit Report: every rate is quoted against the
      // base currency, so X -> report currency is amount * rate(X) / rate(report).
      const rateByIcon = {}
      currenciesResponse.data.data.currencies.forEach(c => {
        rateByIcon[c.icon] = Number(c.rate) || 1
      })
      const company = companyResponse.data.data
      const icon = company.report_currency_icon || company.currency_icon || '₹'
      const reportRate = rateByIcon[icon] || 1
      const toReport = (amount, currencyIcon) => ((Number(amount) || 0) * (rateByIcon[currencyIcon] || 1)) / reportRate
      setReportIcon(icon)

      const isGeneral = row => !row.client_id && !row.project_id
      const linkFilter = row => !linkedTo || (linkedTo.value === 'general' ? isGeneral(row) : !isGeneral(row))
      const rows = payments.filter(linkFilter).map(row => ({ ...row, converted: toReport(row.amount, row.currency) }))

      const total = rows.reduce((sum, r) => sum + r.converted, 0)
      const recurringTotal = rows.filter(r => r.recurring_parent_id || r.recurrence !== 'none').reduce((sum, r) => sum + r.converted, 0)

      const byMonthMap = {}
      rows.forEach(r => {
        const ym = r.expense_date.slice(0, 7)
        byMonthMap[ym] = byMonthMap[ym] || { month: ym, count: 0, total: 0, categories: [] }
        byMonthMap[ym].count++
        byMonthMap[ym].total += r.converted
        const cat = r.category || 'Uncategorized'
        if (!byMonthMap[ym].categories.includes(cat)) byMonthMap[ym].categories.push(cat)
      })
      const monthKeys = Object.keys(byMonthMap).sort()
      const byMonth =
        monthKeys.length > 0
          ? monthRange((dateFrom || monthKeys[0]).slice(0, 7), (dateTo || monthKeys[monthKeys.length - 1]).slice(0, 7)).map(
              ym => byMonthMap[ym] || { month: ym, count: 0, total: 0, categories: [] }
            )
          : []

      const groupBy = keyFn => {
        const map = {}
        rows.forEach(r => {
          const key = keyFn(r)
          map[key] = map[key] || { name: key, count: 0, total: 0 }
          map[key].count++
          map[key].total += r.converted
        })
        return Object.values(map)
          .map(g => ({ ...g, share: total > 0 ? (g.total / total) * 100 : 0 }))
          .sort((a, b) => b.total - a.total)
      }

      const commitments = seriesRows
        .filter(linkFilter)
        .filter(r => r.recurrence && r.recurrence !== 'none' && r.next_occurrence_date)
        .map(r => ({
          ...r,
          monthly: toReport(r.amount, r.currency) / MONTHS_PER_PERIOD[r.recurrence]
        }))
        .sort((a, b) => a.next_occurrence_date.localeCompare(b.next_occurrence_date))

      setReport({
        rows,
        total,
        recurringTotal,
        byMonth,
        byCategory: groupBy(r => r.category || 'Uncategorized'),
        byVendor: groupBy(r => r.vendor_name || 'No vendor'),
        commitments,
        monthlyCommitment: commitments.reduce((sum, c) => sum + c.monthly, 0)
      })
      setHasRun(true)
    } catch (e) {
      toast.error('Failed to load expense report')
    } finally {
      setLoading(false)
    }
  }

  const money = value => `${reportIcon} ${formatAmount(value)}`

  const handleExport = () => {
    if (!report) return
    try {
      // Money cells stay real numbers (so Excel can still sum them) but carry
      // a currency number format, so they display as e.g. "$45,000.00".
      const moneyFormat = icon => `"${String(icon || '').replace(/"/g, '')}"#,##0.00`
      const round2 = value => Math.round((Number(value) || 0) * 100) / 100

      // columns: [{ header, value: row => any, currency?: row => icon }]
      // Widths are sized from the longest displayed value in each column.
      const buildSheet = (rows, columns) => {
        const ws = XLSX.utils.aoa_to_sheet([columns.map(c => c.header), ...rows.map(row => columns.map(c => c.value(row)))])
        const widths = columns.map(c => c.header.length)
        rows.forEach((row, r) => {
          columns.forEach((c, col) => {
            const value = c.value(row)
            let shown = value === null || value === undefined ? '' : String(value)
            if (c.currency) {
              const icon = c.currency(row)
              const cell = ws[XLSX.utils.encode_cell({ r: r + 1, c: col })]
              if (cell) cell.z = moneyFormat(icon)
              shown = `${icon}${formatAmount(value)}`
            }
            widths[col] = Math.max(widths[col], shown.length)
          })
        })
        ws['!cols'] = widths.map(w => ({ wch: Math.min(Math.max(w + 2, 10), 60) }))
        return ws
      }

      const report$ = () => reportIcon
      const summaryRows = [
        ['Generated', new Date().toLocaleString()],
        ['Date From', dateFrom || 'Any'],
        ['Date To', dateTo || 'Any'],
        ['Category', category?.label || 'All'],
        ['Vendor', vendor?.label || 'All'],
        ['Type', expenseType?.label || 'All'],
        ['Client', client?.label || 'All'],
        ['Project', project?.label || 'All'],
        ['Linked To', linkedTo?.label || 'All'],
        ['Reporting Currency', reportIcon],
        ['Total Spent', round2(report.total), true],
        ['Payments', report.rows.length],
        ['Recurring Spend', round2(report.recurringTotal), true],
        ['Monthly Recurring Commitment', round2(report.monthlyCommitment), true]
      ]
      const summary = buildSheet(summaryRows, [
        { header: 'Expense Report', value: r => r[0] },
        { header: '', value: r => r[1] }
      ])
      summaryRows.forEach((row, i) => {
        if (row[2]) summary[XLSX.utils.encode_cell({ r: i + 1, c: 1 })].z = moneyFormat(reportIcon)
      })

      const shareColumns = label => [
        { header: label, value: r => r.name },
        { header: 'Payments', value: r => r.count },
        { header: 'Total', value: r => round2(r.total), currency: report$ },
        { header: 'Share %', value: r => Number(r.share.toFixed(1)) }
      ]

      const sheets = [
        [summary, 'Summary'],
        [
          buildSheet(report.byMonth, [
            { header: 'Month', value: r => monthLabel(r.month) },
            { header: 'Categories', value: r => r.categories.join(', ') },
            { header: 'Payments', value: r => r.count },
            { header: 'Total', value: r => round2(r.total), currency: report$ }
          ]),
          'By Month'
        ],
        [buildSheet(report.byCategory, shareColumns('Category')), 'By Category'],
        [buildSheet(report.byVendor, shareColumns('Vendor')), 'By Vendor'],
        [
          buildSheet(report.commitments, [
            { header: 'Category', value: r => r.category },
            { header: 'Vendor', value: r => r.vendor_name || '' },
            { header: 'Type', value: r => TYPE_LABELS[r.expense_type] || 'One-time' },
            { header: 'Repeats', value: r => REPEAT_LABELS[r.recurrence] },
            { header: 'Amount', value: r => round2(r.amount), currency: r => r.currency },
            { header: 'Next Payment', value: r => shortDate(r.next_occurrence_date) },
            { header: 'Per Month', value: r => round2(r.monthly), currency: report$ }
          ]),
          'Recurring'
        ],
        [
          buildSheet(report.rows, [
            { header: 'Date', value: r => shortDate(r.expense_date) },
            { header: 'Category', value: r => r.category },
            { header: 'Vendor', value: r => r.vendor_name || '' },
            { header: 'Type', value: r => TYPE_LABELS[r.expense_type] || 'One-time' },
            { header: 'Client', value: r => r.client_full_name || '' },
            { header: 'Project', value: r => r.project_name || '' },
            { header: 'Amount', value: r => round2(r.amount), currency: r => r.currency },
            { header: `Amount in ${reportIcon}`, value: r => round2(r.converted), currency: report$ }
          ]),
          'All Payments'
        ]
      ]
      const workbook = XLSX.utils.book_new()
      sheets.forEach(([ws, name]) => XLSX.utils.book_append_sheet(workbook, ws, name))
      const now = new Date()
      const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
      XLSX.writeFile(workbook, `Expense-Report-${stamp}.xlsx`)
      toast.success('Report exported')
    } catch (e) {
      toast.error('Failed to export report')
    }
  }


  const shareColumns = label => [
    { name: label, minWidth: '200px', selector: r => r.name, cell: r => <span className='fw-bolder text-truncate'>{r.name}</span> },
    { name: 'Payments', width: '150px', right: true, selector: r => r.count },
    { name: 'Total', minWidth: '150px', right: true, selector: r => r.total, cell: r => <span className='fw-bolder'>{money(r.total)}</span> },
    {
      name: 'Share',
      minWidth: '170px',
      selector: r => r.share,
      cell: r => (
        <div className='d-flex align-items-center w-100' style={{ gap: '0.5rem' }}>
          <Progress value={r.share} className='flex-grow-1' style={{ height: '6px' }} />
          <small className='text-muted' style={{ width: '42px', textAlign: 'right' }}>
            {r.share.toFixed(1)}%
          </small>
        </div>
      )
    }
  ]

  const monthColumns = [
    { name: 'Month', minWidth: '140px', selector: r => r.month, cell: r => <span className='fw-bolder'>{monthLabel(r.month)}</span> },
    {
      name: 'Categories',
      minWidth: '280px',
      grow: 2,
      selector: r => r.categories.join(', '),
      cell: r => (
        <span className={r.categories.length ? 'text-truncate' : 'text-muted'} title={r.categories.join(', ')}>
          {r.categories.length ? r.categories.join(', ') : '-'}
        </span>
      )
    },
    { name: 'Payments', width: '150px', right: true, selector: r => r.count },
    { name: 'Total', minWidth: '160px', right: true, selector: r => r.total, cell: r => <span className='fw-bolder'>{money(r.total)}</span> }
  ]

  const commitmentColumns = [
    {
      name: 'Expense',
      minWidth: '200px',
      selector: r => r.category,
      cell: r => (
        <div className='d-flex flex-column overflow-hidden'>
          <span className='fw-bolder text-truncate'>{r.category}</span>
          <small className='text-muted text-truncate'>{r.vendor_name || 'No vendor'}</small>
        </div>
      )
    },
    { name: 'Type', width: '130px', selector: r => r.expense_type, cell: r => TYPE_LABELS[r.expense_type] || 'One-time' },
    { name: 'Repeats', width: '120px', selector: r => r.recurrence, cell: r => REPEAT_LABELS[r.recurrence] },
    {
      name: 'Amount',
      minWidth: '140px',
      right: true,
      selector: r => Number(r.amount),
      cell: r => (
        <span>
          {r.currency} {formatAmount(r.amount)}
        </span>
      )
    },
    { name: 'Next Payment', minWidth: '140px', selector: r => r.next_occurrence_date, cell: r => shortDate(r.next_occurrence_date) },
    { name: 'Per Month', minWidth: '140px', right: true, selector: r => r.monthly, cell: r => <span className='fw-bolder'>{money(r.monthly)}</span> }
  ]

  const selectProps = { className: 'react-select', classNamePrefix: 'select', theme: selectThemeColors, isClearable: true }
  const months = report?.byMonth.length || 0

  return (
    <div className='expense-report'>
      <Card>
        <CardHeader className='d-flex justify-content-between align-items-center flex-wrap'>
          <CardTitle tag='h4'>Expense Report</CardTitle>
          <div className='d-flex' style={{ gap: '0.5rem' }}>
            <Button color='secondary' outline onClick={handleReset} disabled={loading}>
              <RotateCcw size={14} className='me-50' />
              Reset
            </Button>
            <Button color='primary' onClick={handleRun} disabled={loading}>
              {loading ? <Spinner size='sm' className='me-50' /> : <Search size={14} className='me-50' />}
              Run Report
            </Button>
            <Button color='success' onClick={handleExport} disabled={!hasRun}>
              <Download size={14} className='me-50' />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <Row>
            <Col lg={3} md={6} className='mb-1'>
              <Label className='form-label' for='date_from'>
                Date From
              </Label>
              <DateField id='date_from' value={dateFrom} onChange={setDateFrom} />
            </Col>
            <Col lg={3} md={6} className='mb-1'>
              <Label className='form-label' for='date_to'>
                Date To
              </Label>
              <DateField id='date_to' value={dateTo} onChange={setDateTo} />
            </Col>
            <Col lg={3} md={6} className='mb-1'>
              <Label className='form-label' for='category'>
                Category
              </Label>
              <Select {...selectProps} inputId='category' options={categoryOptions} value={category} onChange={setCategory} placeholder='All' />
            </Col>
            <Col lg={3} md={6} className='mb-1'>
              <Label className='form-label' for='vendor'>
                Vendor
              </Label>
              <Select {...selectProps} inputId='vendor' options={vendorOptions} value={vendor} onChange={setVendor} placeholder='All' />
            </Col>
            <Col lg={3} md={6} className='mb-1'>
              <Label className='form-label' for='expense_type'>
                Type
              </Label>
              <Select {...selectProps} inputId='expense_type' options={TYPE_OPTIONS} value={expenseType} onChange={setExpenseType} placeholder='All' />
            </Col>
            <Col lg={3} md={6} className='mb-1'>
              <Label className='form-label' for='linked_to'>
                Linked To
              </Label>
              <Select {...selectProps} inputId='linked_to' options={LINK_OPTIONS} value={linkedTo} onChange={setLinkedTo} placeholder='All' />
            </Col>
            <Col lg={3} md={6} className='mb-1'>
              <Label className='form-label' for='client'>
                Client
              </Label>
              <Select {...selectProps} inputId='client' options={clientOptions} value={client} onChange={setClient} placeholder='All' />
            </Col>
            <Col lg={3} md={6} className='mb-1'>
              <Label className='form-label' for='project'>
                Project
              </Label>
              <Select {...selectProps} inputId='project' options={projectOptions} value={project} onChange={setProject} placeholder='All' />
            </Col>
          </Row>
          <p className='text-muted small mb-0'>
            Every payment is counted on its own date - each month of a recurring expense counts separately. Amounts are converted into the
            company's Report Currency (Company Settings → General){reportIcon ? ` - currently ${reportIcon}` : ''} using each currency's
            exchange rate.
          </p>
        </CardBody>
      </Card>

      {hasRun && report && (
        <>
          <Row className='mt-1'>
            <StatCard icon={DollarSign} color='danger' label='Total Spent' value={money(report.total)} />
            <StatCard icon={Hash} color='primary' label='Payments' value={report.rows.length} />
            <StatCard
              icon={Calendar}
              color='info'
              label='Average per Month'
              value={money(months ? report.total / months : 0)}
              hint={months ? `over ${months} month${months === 1 ? '' : 's'}` : ''}
            />
            <StatCard
              icon={Repeat}
              color='warning'
              label='Recurring per Month'
              value={money(report.monthlyCommitment)}
              hint={`${report.commitments.length} active recurring expense${report.commitments.length === 1 ? '' : 's'}`}
            />
          </Row>

          <Row>
            <Col xl={6}>
              <Card>
                <CardHeader>
                  <CardTitle tag='h5'>By Category</CardTitle>
                </CardHeader>
                <div className='react-dataTable'>
                  <DataTable noHeader responsive columns={shareColumns('Category')} data={report.byCategory} className='react-dataTable' />
                </div>
              </Card>
            </Col>
            <Col xl={6}>
              <Card>
                <CardHeader>
                  <CardTitle tag='h5'>By Vendor</CardTitle>
                </CardHeader>
                <div className='react-dataTable'>
                  <DataTable noHeader responsive columns={shareColumns('Vendor')} data={report.byVendor} className='react-dataTable' />
                </div>
              </Card>
            </Col>
          </Row>

          <Card>
            <CardHeader>
              <CardTitle tag='h5'>Recurring Expenses</CardTitle>
            </CardHeader>
            <div className='react-dataTable'>
              <DataTable
                noHeader
                responsive
                columns={commitmentColumns}
                data={report.commitments}
                className='react-dataTable'
                noDataComponent={<TableEmptyState icon={Repeat} noun='recurring expenses' filtered filteredMessage='No active recurring expenses match these filters.' />}
              />
            </div>
          </Card>
          <Card>
            <CardHeader className='d-flex justify-content-between align-items-center flex-wrap'>
              <CardTitle tag='h5'>Spending by Month</CardTitle>
              <div className='d-flex align-items-center' style={{ gap: '0.5rem' }}>
                {monthFilter && (
                  <Button color='flat-secondary' size='sm' onClick={() => setMonthFilter('')}>
                    Show all
                  </Button>
                )}
                <Input
                  type='month'
                  aria-label='Show one month'
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                  style={{ width: '180px' }}
                />
              </div>
            </CardHeader>
            <div className='react-dataTable'>
              <DataTable
                noHeader
                responsive
                pagination
                paginationPerPage={10}
                paginationComponent={CustomPagination}
                paginationResetDefaultPage={monthFilter}
                columns={monthColumns}
                data={monthFilter ? report.byMonth.filter(r => r.month === monthFilter) : report.byMonth}
                className='react-dataTable'
                noDataComponent={
                  <TableEmptyState
                    icon={PieChart}
                    noun='expenses'
                    filtered
                    filteredMessage={monthFilter ? 'No spending in this month.' : 'No expenses match these filters.'}
                  />
                }
              />
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

export default ExpenseReport
