import { useContext } from 'react'
import { CheckSquare, UserCheck, AlertCircle } from 'react-feather'
import Chart from 'react-apexcharts'
import { Card, CardBody } from 'reactstrap'
import { ThemeColors } from '@src/utility/context/ThemeColors'

// Stat list is whatever DashboardController::supportTracker() sends
// (Open Todos / Pending Approvals / Overdue Invoices today) - icons/colors
// here just cycle by position so a 4th stat added server-side still
// renders instead of being dropped.
const ICONS = [CheckSquare, UserCheck, AlertCircle]
const COLORS = ['info', 'warning', 'danger']

const SupportTrackerCard = ({ data }) => {
  const { colors } = useContext(ThemeColors)
  const pct = data.completion_pct || 0

  const options = {
    chart: { type: 'radialBar', sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        hollow: { size: '65%' },
        track: { background: colors?.secondary?.light || '#ebe9f1' },
        dataLabels: {
          name: { show: true, offsetY: 20, color: '#a0a0a0', fontSize: '13px' },
          value: { show: true, offsetY: -10, fontSize: '24px', fontWeight: 600, formatter: val => `${val}%` }
        }
      }
    },
    colors: [colors?.primary?.main || '#7367f0'],
    labels: ['Completed Task'],
    stroke: { lineCap: 'round' }
  }

  return (
    <Card className='h-100'>
      <CardBody className='d-flex flex-column'>
        <h5 className='mb-0'>Support Tracker</h5>
        <small className='text-muted'>Open Items Overview</small>

        <div className='d-flex align-items-center justify-content-between flex-grow-1 mt-1'>
          <div>
            {data.stats.map((stat, index) => {
              const Icon = ICONS[index % ICONS.length]
              const color = COLORS[index % COLORS.length]
              return (
                <div key={stat.label} className='d-flex align-items-center mb-1'>
                  <div className={`avatar avatar-sm p-50 m-0 me-1 bg-light-${color}`}>
                    <div className='avatar-content'>
                      <Icon size={15} />
                    </div>
                  </div>
                  <div>
                    <h5 className='mb-0'>{stat.value}</h5>
                    <small className='text-muted'>{stat.label}</small>
                  </div>
                </div>
              )
            })}
          </div>
          <Chart options={options} series={[pct]} type='radialBar' height={190} width={190} />
        </div>
      </CardBody>
    </Card>
  )
}

export default SupportTrackerCard
