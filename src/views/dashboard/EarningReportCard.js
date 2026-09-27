import { useContext } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'react-feather'
import Chart from 'react-apexcharts'
import { Card, CardBody, Badge, Progress } from 'reactstrap'
import { ThemeColors } from '@src/utility/context/ThemeColors'
import { formatAmount } from '@utils'

// Weekly Mon-Sun collections (from InvoicePayment) plus the current
// month's Earnings/Profit/Expense split - the same figures the Profit
// Report page aggregates, just for the current month at a glance.
// Progress bar widths are relative to the largest of the three so the
// biggest figure always reads as a full bar, same as the Vuexy demo card
// this is modeled on.
const BREAKDOWN = [
  { key: 'month_earnings', label: 'Earnings', color: 'primary' },
  { key: 'month_profit', label: 'Profit', color: 'info' },
  { key: 'month_expense', label: 'Expense', color: 'danger' }
]

const EarningReportCard = ({ data }) => {
  const { colors } = useContext(ThemeColors)

  const series = data.week_series || []
  const maxIndex = series.length ? series.indexOf(Math.max(...series)) : -1
  const maxBreakdown = Math.max(1, ...BREAKDOWN.map(({ key }) => data[key] || 0))
  const isUp = (data.change_pct || 0) >= 0

  const options = {
    chart: { type: 'bar', toolbar: { show: false }, sparkline: { enabled: false } },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 4, distributed: true } },
    colors: series.map((_, i) => (i === maxIndex ? colors?.primary?.main || '#7367f0' : colors?.secondary?.light || '#e0e0e0')),
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: data.week_labels || [],
      labels: { style: { fontSize: '11px', colors: '#a0a0a0' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { show: false },
    grid: { show: false, padding: { left: 0, right: 0, top: -10, bottom: -10 } },
    tooltip: { y: { formatter: val => formatAmount(val) } }
  }

  return (
    <Card className='h-100'>
      <CardBody>
        <h5 className='mb-0'>Earning Reports</h5>
        <small className='text-muted'>Weekly Earnings Overview</small>

        <div className='d-flex align-items-center flex-wrap mt-1'>
          <div className='me-2'>
            <div className='d-flex align-items-center'>
              <h1 className='fw-bolder mb-0 me-1'>{formatAmount(data.this_week_total)}</h1>
              <Badge color={isUp ? 'light-success' : 'light-danger'} pill>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(data.change_pct || 0)}%
              </Badge>
            </div>
            <small className='text-muted'>You informed of this week compared to last week</small>
          </div>
          <div className='flex-grow-1' style={{ minWidth: 200 }}>
            <Chart options={options} series={[{ name: 'Earnings', data: series }]} type='bar' height={110} />
          </div>
        </div>

        <div className='border-top pt-1 mt-1'>
          {BREAKDOWN.map(({ key, label, color }) => (
            <div key={key} className='d-flex align-items-center mb-1'>
              <div className={`avatar avatar-sm p-50 m-0 me-1 bg-light-${color}`}>
                <div className='avatar-content'>
                  {label === 'Expense' ? <Percent size={15} /> : <DollarSign size={15} />}
                </div>
              </div>
              <div className='flex-grow-1'>
                <small className='text-muted d-block'>{label}</small>
                <div className='d-flex align-items-center'>
                  <span className='fw-bolder me-1'>{formatAmount(data[key])}</span>
                  <Progress
                    value={(Math.max(0, data[key] || 0) / maxBreakdown) * 100}
                    color={color}
                    className='flex-grow-1'
                    style={{ height: '6px' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

export default EarningReportCard
