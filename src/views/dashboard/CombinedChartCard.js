import { useContext } from 'react'
import { Link } from 'react-router-dom'
import Chart from 'react-apexcharts'
import { Card, CardBody } from 'reactstrap'
import { ThemeColors } from '@src/utility/context/ThemeColors'

// One actual chart for every status-breakdown block in a section (Invoice/
// Quotation/Project), not one chart each - a single horizontal stacked bar,
// one row per module, segmented by that module's own statuses. A status
// name shared across modules (e.g. "draft" on both Invoices and
// Quotations) is one series and keeps the same color wherever it appears,
// so the legend reads as "this status, across modules" rather than
// per-module duplicates.
const PALETTE = ['primary', 'success', 'warning', 'info', 'danger', 'secondary', 'primary', 'success']

const CombinedChartCard = ({ items }) => {
  const { colors } = useContext(ThemeColors)

  const categories = items.map(item => item.title)
  const statuses = [...new Set(items.flatMap(item => Object.keys(item.byStatus || {})))]
  const hasData = statuses.length > 0

  const series = statuses.map(status => ({
    name: status.replace(/_/g, ' '),
    data: items.map(item => (item.byStatus || {})[status] || 0)
  }))

  const options = {
    chart: { stacked: true, toolbar: { show: false } },
    colors: statuses.map((_, index) => colors?.[PALETTE[index % PALETTE.length]]?.main || '#7367f0'),
    plotOptions: { bar: { horizontal: true, barHeight: '45%', borderRadius: 4 } },
    xaxis: { categories, labels: { formatter: val => Math.round(val) } },
    dataLabels: { enabled: true, formatter: val => (val > 0 ? val : '') },
    legend: { show: true, position: 'bottom', fontSize: '12px' },
    grid: { xaxis: { lines: { show: false } } }
  }

  return (
    <Card className='h-100'>
      <CardBody>
        {items.map((item, index) => (
          <div
            key={item.title}
            className={`d-flex align-items-center justify-content-between py-50 ${index < items.length - 1 ? 'border-bottom' : ''}`}
          >
            <div className='d-flex align-items-center'>
              <div className={`avatar avatar-sm p-50 m-0 me-1 bg-light-${item.color}`}>
                <div className='avatar-content'>
                  <item.icon size={16} />
                </div>
              </div>
              <span className='fw-bolder'>{item.title}</span>
              {item.extraStats.map((stat, i) => (
                <span key={i} className='text-muted ms-2'>
                  {stat.label}: <span className='fw-bolder text-body'>{stat.value}</span>
                </span>
              ))}
            </div>
            <Link to={item.path} className='text-nowrap'>
              View all
            </Link>
          </div>
        ))}
        {hasData ? (
          <Chart options={options} series={series} type='bar' height={items.length * 70 + 60} />
        ) : (
          <p className='text-muted mb-0 mt-1'>No data yet</p>
        )}
      </CardBody>
    </Card>
  )
}

export default CombinedChartCard
