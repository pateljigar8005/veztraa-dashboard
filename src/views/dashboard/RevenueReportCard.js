import { useContext } from 'react'

// ** Third Party Components
import Chart from 'react-apexcharts'

// ** Reactstrap Imports
import { Row, Col, Card, CardTitle } from 'reactstrap'

import { ThemeColors } from '@src/utility/context/ThemeColors'
import { formatAmount } from '@utils'

// Port of Vuexy's "Revenue Report" analytics card
// (react-version/vite-bootstrap5/full-version/.../RevenueReport.js), minus
// the budget side panel (removed per request). Shows invoiced vs collected
// amounts per month (DashboardController::revenueReport(), admin-only) as
// GROUPED bars, not the template's stacked Earning/Expense layout - stacking
// Invoiced+Collected sums them into a height with no real meaning (and
// Collected can come from invoices issued in earlier months, so a stacked
// bar can end up taller than that month's invoiced amount, which reads as a
// bug). Grouped bars let the two be compared per month, which is the actual
// point of this chart.
// Invoiced/collected amounts are already converted into the company's
// report currency server-side (DashboardController::revenueReport() ->
// Invoice/InvoicePayment::monthlySumsForRange(), see
// veztraa-api/helpers/ReportCurrency.php) - currencyIcon (from the same
// /dashboard/summary response) just labels what that currency is.
// Short axis labels (₹40K, ₹1.2M) - the full ₹160,000.00 form ate a wide
// strip of the card. Tooltips still show the exact amount.
const compactAmount = val => {
  const abs = Math.abs(val)
  if (abs >= 1e6) return `${+(val / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `${+(val / 1e3).toFixed(1)}K`
  return `${Math.round(val)}`
}

const RevenueReportCard = ({ data, currencyIcon = '' }) => {
  const { colors } = useContext(ThemeColors)
  const primary = colors?.primary?.main || '#7367f0'
  // Hardcoded, not pulled from the theme's "warning" token - that one
  // resolves to an orange (#ff9f43), not the golden yellow asked for here.
  const collectedColor = '#FFC107'

  const months = data?.months || []
  const invoiced = data?.invoiced || []
  const collected = data?.collected || []

  const revenueOptions = {
      chart: {
        stacked: false,
        type: 'bar',
        toolbar: { show: false }
      },
      grid: {
        padding: { top: -20, bottom: -10 },
        yaxis: { lines: { show: false } }
      },
      xaxis: {
        categories: months,
        labels: { style: { colors: '#b9b9c3', fontSize: '0.86rem' } },
        axisTicks: { show: false },
        axisBorder: { show: false }
      },
      legend: { show: false },
      dataLabels: { enabled: false },
      colors: [primary, collectedColor],
      plotOptions: {
        bar: {
          columnWidth: '50%',
          borderRadius: 4
        }
      },
      yaxis: {
        labels: { style: { colors: '#b9b9c3', fontSize: '0.86rem' }, formatter: val => `${currencyIcon}${compactAmount(val)}` }
      },
      tooltip: {
        y: { formatter: val => `${currencyIcon}${formatAmount(val)}` }
      }
    },
    revenueSeries = [
      { name: 'Invoiced', data: invoiced },
      { name: 'Collected', data: collected }
    ]

  return (
    <Card className='card-revenue-budget h-100'>
      <Row className='mx-0'>
        <Col className='revenue-report-wrapper' md='12' xs='12'>
          <div className='d-sm-flex justify-content-between align-items-center mb-3'>
            <CardTitle className='mb-50 mb-sm-0'>Revenue Report</CardTitle>
            <div className='d-flex align-items-center'>
              <div className='d-flex align-items-center me-2'>
                <span className='bullet bullet-primary me-50 cursor-pointer'></span>
                <span>Invoiced</span>
              </div>
              <div className='d-flex align-items-center'>
                <span className='bullet me-50 cursor-pointer' style={{ backgroundColor: collectedColor }}></span>
                <span>Collected</span>
              </div>
            </div>
          </div>
          <Chart id='revenue-report-chart' type='bar' height='230' options={revenueOptions} series={revenueSeries} />
        </Col>
      </Row>
    </Card>
  )
}

export default RevenueReportCard
