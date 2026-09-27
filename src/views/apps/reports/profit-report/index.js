import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import DataTable from 'react-data-table-component'
import { Search, RotateCcw, Download, TrendingUp, TrendingDown, DollarSign, PieChart } from 'react-feather'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Label, Button, Spinner, Input } from 'reactstrap'
import DateField from '../../shared/DateField'
import { formatAmount } from '@utils'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import TableEmptyState from '@src/views/apps/shared/TableEmptyState'

const EmptyIcon = PieChart

const monthLabel = ym => {
  const [year, month] = ym.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

const fetchAllPages = async (url, params) => {
  let page = 1
  let all = []
  const listKey = { '/invoices': 'invoices', '/expenses': 'expenses', '/vendor-bills': 'vendorBills' }[url]
  while (true) {
    const response = await axios.get(url, { params: { ...params, page, perPage: 100 } })
    const rows = response.data.data[listKey]
    const total = response.data.data.total
    all = all.concat(rows)
    if (rows.length === 0 || all.length >= total) break
    page++
  }
  return all
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

const ProfitReport = () => {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [includePayroll, setIncludePayroll] = useState(true)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [monthRows, setMonthRows] = useState([])
  const [clientRows, setClientRows] = useState([])
  const [totals, setTotals] = useState({ revenue: 0, expenses: 0, vendorBills: 0, payroll: 0, profit: 0 })
  const [reportIcon, setReportIcon] = useState('')

  const handleReset = () => {
    setDateFrom('')
    setDateTo('')
    setIncludePayroll(true)
    setMonthRows([])
    setClientRows([])
    setHasRun(false)
  }

  const handleRun = async () => {
    setLoading(true)
    try {
      const invoiceParams = { issue_date_from: dateFrom || undefined, issue_date_to: dateTo || undefined }
      const expenseParams = { expense_date_from: dateFrom || undefined, expense_date_to: dateTo || undefined }
      const billParams = { bill_date_from: dateFrom || undefined, bill_date_to: dateTo || undefined }

      const [invoices, expenses, vendorBills, payrollResponse, currenciesResponse, companyResponse] = await Promise.all([
        fetchAllPages('/invoices', invoiceParams),
        fetchAllPages('/expenses', expenseParams),
        fetchAllPages('/vendor-bills', billParams),
        axios.get('/payroll-runs', { params: { perPage: 100 } }),
        axios.get('/currencies', { params: { perPage: 100 } }),
        axios.get('/company')
      ])

      // Every currency's rate is quoted against the company's base currency
      // (see src/utility/Utils.js findUsdRate() comment), so converting X -> Y
      // goes through that base: amount * rate(X) gets to base, / rate(Y) gets
      // to Y. Payroll's total_net carries no currency of its own (payroll
      // never converts per-employee salary_currency - see PayrollController),
      // so it's treated as already being in the base currency.
      const rateByIcon = {}
      currenciesResponse.data.data.currencies.forEach(c => {
        rateByIcon[c.icon] = Number(c.rate) || 1
      })
      const company = companyResponse.data.data
      const icon = company.report_currency_icon || company.currency_icon || 'USD'
      const reportRate = rateByIcon[icon] || 1
      const toReport = (amount, currencyIcon) => {
        const rate = currencyIcon ? rateByIcon[currencyIcon] || 1 : 1
        return (amount * rate) / reportRate
      }
      setReportIcon(icon)

      const payrollRuns = payrollResponse.data.data.payroll_runs.filter(run => {
        const ym = `${run.year}-${String(run.month).padStart(2, '0')}`
        if (dateFrom && ym < dateFrom.slice(0, 7)) return false
        if (dateTo && ym > dateTo.slice(0, 7)) return false
        return true
      })

      const byMonth = {}
      const ensureMonth = ym => {
        if (!byMonth[ym]) byMonth[ym] = { month: ym, revenue: 0, expenses: 0, vendorBills: 0, payroll: 0 }
        return byMonth[ym]
      }
      invoices.forEach(inv => {
        ensureMonth(inv.issue_date.slice(0, 7)).revenue += toReport(Number(inv.total) || 0, inv.currency)
      })
      expenses.forEach(exp => {
        ensureMonth(exp.expense_date.slice(0, 7)).expenses += toReport(Number(exp.amount) || 0, exp.currency)
      })
      vendorBills.forEach(bill => {
        ensureMonth(bill.bill_date.slice(0, 7)).vendorBills += toReport(Number(bill.amount) || 0, bill.currency)
      })
      if (includePayroll) {
        payrollRuns.forEach(run => {
          const ym = `${run.year}-${String(run.month).padStart(2, '0')}`
          ensureMonth(ym).payroll += toReport(Number(run.total_net) || 0, null)
        })
      }

      const monthTable = Object.values(byMonth)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(row => ({ ...row, profit: row.revenue - row.expenses - row.vendorBills - row.payroll }))

      const byClient = {}
      const ensureClient = (key, label) => {
        if (!byClient[key]) byClient[key] = { client: label, revenue: 0, expenses: 0 }
        return byClient[key]
      }
      invoices.forEach(inv => {
        const key = inv.client_id || `unlinked-${inv.contact_name}`
        const label = inv.company_name || inv.contact_name || 'Unlinked'
        ensureClient(key, label).revenue += toReport(Number(inv.total) || 0, inv.currency)
      })
      expenses.forEach(exp => {
        if (!exp.client_id) return
        ensureClient(exp.client_id, exp.client_full_name || 'Unlinked').expenses += toReport(Number(exp.amount) || 0, exp.currency)
      })

      const clientTable = Object.values(byClient)
        .map(row => ({ ...row, profit: row.revenue - row.expenses }))
        .sort((a, b) => b.revenue - a.revenue)

      const grandTotals = monthTable.reduce(
        (acc, r) => {
          acc.revenue += r.revenue
          acc.expenses += r.expenses
          acc.vendorBills += r.vendorBills
          acc.payroll += r.payroll
          acc.profit += r.profit
          return acc
        },
        { revenue: 0, expenses: 0, vendorBills: 0, payroll: 0, profit: 0 }
      )

      setMonthRows(monthTable)
      setClientRows(clientTable)
      setTotals(grandTotals)
      setHasRun(true)
    } catch (e) {
      toast.error('Failed to load profit report')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!hasRun) {
      toast.error('Nothing to export - run the report first')
      return
    }

    setExporting(true)
    try {
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ['Profit Report'],
        ['Generated', new Date().toLocaleString()],
        ['Date From', dateFrom || 'Any'],
        ['Date To', dateTo || 'Any'],
        ['Includes Payroll Cost', includePayroll ? 'Yes' : 'No'],
        ['Reporting Currency', reportIcon],
        [],
        ['Total Revenue', totals.revenue.toFixed(2)],
        ['Total Expenses', totals.expenses.toFixed(2)],
        ['Total Vendor Bills', totals.vendorBills.toFixed(2)],
        ['Total Payroll', totals.payroll.toFixed(2)],
        ['Net Profit', totals.profit.toFixed(2)]
      ])
      summarySheet['!cols'] = [{ wch: 22 }, { wch: 22 }]

      const monthSheet = XLSX.utils.json_to_sheet(
        monthRows.map(r => ({
          Month: monthLabel(r.month),
          Revenue: Number(r.revenue.toFixed(2)),
          Expenses: Number(r.expenses.toFixed(2)),
          'Vendor Bills': Number(r.vendorBills.toFixed(2)),
          Payroll: Number(r.payroll.toFixed(2)),
          Profit: Number(r.profit.toFixed(2))
        }))
      )

      const clientSheet = XLSX.utils.json_to_sheet(
        clientRows.map(r => ({
          Client: r.client,
          Revenue: Number(r.revenue.toFixed(2)),
          Expenses: Number(r.expenses.toFixed(2)),
          Profit: Number(r.profit.toFixed(2))
        }))
      )

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      XLSX.utils.book_append_sheet(workbook, monthSheet, 'By Month')
      XLSX.utils.book_append_sheet(workbook, clientSheet, 'By Client')
      XLSX.writeFile(workbook, `Profit-Report-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Report exported')
    } catch (e) {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  const money = value => `${reportIcon} ${formatAmount(value)}`

  const monthColumns = [
    { name: 'Month', minWidth: '120px', selector: row => row.month, cell: row => <span className='fw-bolder'>{monthLabel(row.month)}</span> },
    { name: 'Revenue', minWidth: '150px', right: true, selector: row => row.revenue, cell: row => <span className='text-success'>{money(row.revenue)}</span> },
    { name: 'Expenses', minWidth: '150px', right: true, selector: row => row.expenses, cell: row => <span className='text-danger'>{money(row.expenses)}</span> },
    { name: 'Vendor Bills', minWidth: '150px', right: true, selector: row => row.vendorBills, cell: row => <span className='text-danger'>{money(row.vendorBills)}</span> },
    { name: 'Payroll', minWidth: '150px', right: true, selector: row => row.payroll, cell: row => <span className='text-danger'>{money(row.payroll)}</span> },
    {
      name: 'Profit',
      minWidth: '160px',
      right: true,
      selector: row => row.profit,
      cell: row => <span className={row.profit >= 0 ? 'fw-bolder text-success' : 'fw-bolder text-danger'}>{money(row.profit)}</span>
    }
  ]

  const clientColumns = [
    { name: 'Client', minWidth: '200px', selector: row => row.client, cell: row => <span className='fw-bolder'>{row.client}</span> },
    { name: 'Revenue', minWidth: '160px', right: true, selector: row => row.revenue, cell: row => <span className='text-success'>{money(row.revenue)}</span> },
    { name: 'Direct Expenses', minWidth: '170px', right: true, selector: row => row.expenses, cell: row => <span className='text-danger'>{money(row.expenses)}</span> },
    {
      name: 'Profit',
      minWidth: '160px',
      right: true,
      selector: row => row.profit,
      cell: row => <span className={row.profit >= 0 ? 'fw-bolder text-success' : 'fw-bolder text-danger'}>{money(row.profit)}</span>
    }
  ]

  return (
    <div className='profit-report'>
      <Card>
        <CardHeader className='d-flex justify-content-between align-items-center flex-wrap'>
          <CardTitle tag='h4'>Profit Report</CardTitle>
          <div className='d-flex' style={{ gap: '0.5rem' }}>
            <Button color='secondary' outline onClick={handleReset} disabled={loading}>
              <RotateCcw size={14} className='me-50' />
              Reset
            </Button>
            <Button color='primary' onClick={handleRun} disabled={loading}>
              {loading ? <Spinner size='sm' className='me-50' /> : <Search size={14} className='me-50' />}
              Run Report
            </Button>
            <Button color='success' onClick={handleExport} disabled={exporting || !hasRun}>
              <Download size={14} className='me-50' />
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <Row>
            <Col md={3} className='mb-1'>
              <Label className='form-label' for='date_from'>
                Date From
              </Label>
              <DateField id='date_from' value={dateFrom} onChange={setDateFrom} />
            </Col>
            <Col md={3} className='mb-1'>
              <Label className='form-label' for='date_to'>
                Date To
              </Label>
              <DateField id='date_to' value={dateTo} onChange={setDateTo} />
            </Col>
            <Col md={3} className='mb-1 d-flex align-items-end'>
              <div className='form-check'>
                <Input
                  type='checkbox'
                  id='include_payroll'
                  checked={includePayroll}
                  onChange={e => setIncludePayroll(e.target.checked)}
                />
                <Label className='form-check-label' for='include_payroll'>
                  Include payroll cost (monthly only)
                </Label>
              </div>
            </Col>
          </Row>
          <p className='text-muted small mb-0'>
            Every figure below is converted into the company's Report Currency (Company Settings → General){reportIcon ? ` — currently ${reportIcon}` : ''},
            using each currency's exchange rate. Revenue counts each invoice's full total against its issue date. Client
            profit compares revenue to only the expenses directly linked to that client - vendor bills and payroll
            aren't attributed to a client and only appear in the monthly totals.
          </p>
        </CardBody>
      </Card>

      {hasRun && (
        <>
          <Row className='mt-1'>
            <StatCard icon={TrendingUp} color='success' label='Total Revenue' value={money(totals.revenue)} />
            <StatCard icon={TrendingDown} color='danger' label='Total Costs' value={money(totals.expenses + totals.vendorBills + totals.payroll)} />
            <StatCard icon={DollarSign} color={totals.profit >= 0 ? 'success' : 'danger'} label='Net Profit' value={money(totals.profit)} />
            <StatCard icon={PieChart} color='info' label='Months Covered' value={monthRows.length} />
          </Row>

          <Card>
            <CardHeader>
              <CardTitle tag='h5'>Profit by Month</CardTitle>
            </CardHeader>
            <div className='react-dataTable'>
              <DataTable
                noHeader
                responsive
                columns={monthColumns}
                className='react-dataTable'
                data={monthRows}
                noDataComponent={<TableEmptyState icon={EmptyIcon} noun='months' filtered filteredMessage='No revenue, expenses or bills in this date range.' />}
              />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle tag='h5'>Profit by Client</CardTitle>
            </CardHeader>
            <div className='react-dataTable'>
              <DataTable
                noHeader
                pagination
                responsive
                paginationRowsPerPageOptions={[10, 25, 50]}
                columns={clientColumns}
                className='react-dataTable'
                data={clientRows}
                noDataComponent={<TableEmptyState icon={EmptyIcon} noun='clients' filtered filteredMessage='No invoiced clients in this date range.' />}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

export default ProfitReport
