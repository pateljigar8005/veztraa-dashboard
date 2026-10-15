import { useContext } from 'react'
import Chart from 'react-apexcharts'
import { Row, Col, Card, CardBody, CardText, CardTitle, CardHeader } from 'reactstrap'
import { ThemeColors } from '@src/utility/context/ThemeColors'

// Same dashed dual-tone radial gauge/layout as Vuexy's reactstrap
// "Support Tracker" card, now backed by real data
// (DashboardController::supportTracker(): Open Todos / Pending Approvals /
// Overdue Invoices + Todo::completionRate()) instead of the template's
// static ticket numbers. Dropped the decorative "Last 7 days" dropdown -
// it never actually filtered anything, and that's misleading once the
// numbers themselves are real.
const SupportTrackerCard = ({ data }) => {
  const { colors } = useContext(ThemeColors)
  const primary = colors?.primary?.main || '#7367f0'
  const danger = colors?.danger?.main || '#ea5455'

  const stats = data?.stats || []
  const completionPct = data?.completion_pct || 0
  const totalOpenItems = stats.reduce((sum, stat) => sum + (stat.value || 0), 0)

  const options = {
    plotOptions: {
      radialBar: {
        size: 150,
        offsetY: 20,
        startAngle: -150,
        endAngle: 150,
        hollow: { size: '65%' },
        track: { background: '#fff', strokeWidth: '100%' },
        dataLabels: {
          name: { offsetY: -5, fontFamily: 'Montserrat', fontSize: '1rem' },
          value: { offsetY: 15, fontFamily: 'Montserrat', fontSize: '1.714rem' }
        }
      }
    },
    colors: [danger],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: [primary],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    stroke: { dashArray: 8 },
    labels: ['Completed Todos']
  }

  return (
    <Card className='h-100'>
      <CardHeader className='pb-0'>
        <CardTitle tag='h4'>Support Tracker</CardTitle>
      </CardHeader>
      <CardBody>
        <Row>
          <Col sm='2' className='d-flex flex-column flex-wrap text-center'>
            <h1 className='font-large-2 fw-bolder mt-2 mb-0'>{totalOpenItems}</h1>
            <CardText>Needs Attention</CardText>
          </Col>
          <Col sm='10' className='d-flex justify-content-center'>
            <Chart
              options={options}
              series={[completionPct]}
              type='radialBar'
              height={270}
              id='support-tracker-card'
            />
          </Col>
        </Row>
        <div className='d-flex justify-content-between mt-1'>
          {stats.map(stat => (
            <div key={stat.label} className='text-center'>
              <CardText className='mb-50'>{stat.label}</CardText>
              <span className='font-large-1 fw-bold'>{stat.value}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

export default SupportTrackerCard
