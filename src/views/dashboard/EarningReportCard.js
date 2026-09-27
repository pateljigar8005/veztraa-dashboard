import { useContext } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Clock, CreditCard, MoreVertical } from 'react-feather'
import Chart from 'react-apexcharts'
import { Card, CardBody, CardTitle, CardSubtitle, Badge, Progress, Row, Col } from 'reactstrap'
import { ThemeColors } from '@src/utility/context/ThemeColors'
import { formatAmount } from '@utils'

// Weekly Mon-Sun collections (from InvoicePayment) plus the current
// month's Earnings/Profit/Expense split - the same figures the Profit
// Report page aggregates, just for the current month at a glance. Same
// 3-column icon/value/progress-bar layout as Vuexy's own "Earning Reports"
// demo card - progress width is relative to the largest of the three so
// the biggest figure always reads as a full bar.
const BREAKDOWN = [
  { key: 'month_earnings', label: 'Earnings', icon: DollarSign, color: 'primary' },
  { key: 'month_profit', label: 'Profit', icon: Clock, color: 'info' },
  { key: 'month_expense', label: 'Expense', icon: CreditCard, color: 'danger' }
]

const EarningReportCard = ({ data }) => {
  const { colors } = useContext(ThemeColors)

  const series = data.week_series || []
  const maxIndex = series.length ? series.indexOf(Math.max(...series)) : -1
  const maxBreakdown = Math.max(1, ...BREAKDOWN.map(({ key }) => data[key] || 0))
  const isUp = (data.change_pct || 0) >= 0

  const options = {
    chart: { type: 'bar', toolbar: { show: false }, sparkline: { enabled: false } },
    plotOptions: { bar: { columnWidth: '38%', borderRadius: 4, distributed: true } },
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
        <div className='d-flex align-items-start justify-content-between'>
          <div>
            <CardTitle tag='h4' className='mb-25'>
              Earning Reports
            </CardTitle>
            <CardSubtitle tag='p' className='text-muted mb-0'>
              Weekly Earnings Overview
            </CardSubtitle>
          </div>
          <MoreVertical size={18} className='text-muted cursor-pointer' />
        </div>

        <Row className='align-items-center mt-2'>
          <Col xs='5'>
            <div className='d-flex align-items-center flex-wrap'>
              <h1 className='fw-bolder mb-0 me-50'>{formatAmount(data.this_week_total)}</h1>
              <Badge color={isUp ? 'light-success' : 'light-danger'} pill>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(data.change_pct || 0)}%
              </Badge>
            </div>
            <p className='text-muted mb-0 mt-50'>You informed of this week compared to last week</p>
          </Col>
          <Col xs='7'>
            <Chart options={options} series={[{ name: 'Earnings', data: series }]} type='bar' height={110} />
          </Col>
        </Row>

        <Row className='border-top pt-2 mt-2'>
          {BREAKDOWN.map(({ key, label, icon: Icon, color }) => (
            <Col xs='4' key={key}>
              <div className='d-flex align-items-center mb-50'>
                <div className={`avatar avatar-sm bg-light-${color} me-50`}>
                  <div className='avatar-content'>
                    <Icon size={13} />
                  </div>
                </div>
                <span className='text-muted'>{label}</span>
              </div>
              <h5 className='fw-bolder mb-50'>{formatAmount(data[key])}</h5>
              <Progress value={(Math.max(0, data[key] || 0) / maxBreakdown) * 100} color={color} style={{ height: '6px' }} />
            </Col>
          ))}
        </Row>
      </CardBody>
    </Card>
  )
}

export default EarningReportCard
