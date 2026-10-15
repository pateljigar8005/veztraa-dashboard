import { useContext } from 'react'

// ** Third Party Components
import Chart from 'react-apexcharts'
import { Circle } from 'react-feather'

// ** Reactstrap Imports
import { Card, CardBody, CardText, CardTitle, CardHeader } from 'reactstrap'

import { ThemeColors } from '@src/utility/context/ThemeColors'

// Port of Vuexy's "Sales" radar-chart analytics card
// (react-version/vite-bootstrap5/full-version/.../Sales.js), now backed by
// real data (DashboardController::salesRadar(), admin-only) - quotations
// vs invoices issued per month, i.e. the sales funnel, instead of the
// template's "Sales"/"Visits" numbers which have no real equivalent in a
// B2B invoicing app (no web-traffic tracking exists here). Dropped the
// decorative "Last 28 Days" dropdown - it never filtered anything.
const SalesRadarCard = ({ data }) => {
  const { colors } = useContext(ThemeColors)
  const primary = colors?.primary?.main || '#7367f0'
  const info = colors?.info?.main || '#00cfe8'

  const months = data?.months || []
  const quotations = data?.quotations || []
  const invoices = data?.invoices || []

  const options = {
      chart: {
        height: 300,
        type: 'radar',
        dropShadow: { enabled: true, blur: 8, left: 1, top: 1, opacity: 0.2 },
        toolbar: { show: false },
        offsetY: 5
      },
      stroke: { width: 0 },
      dataLabels: { background: { foreColor: ['#ebe9f1'] } },
      legend: { show: false },
      colors: [primary, info],
      plotOptions: {
        radar: {
          polygons: {
            strokeColors: ['#ebe9f1', 'transparent', 'transparent', 'transparent', 'transparent', 'transparent'],
            connectorColors: 'transparent'
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: [primary, info],
          shadeIntensity: 1,
          type: 'horizontal',
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100, 100, 100]
        }
      },
      labels: months,
      markers: { size: 0 },
      yaxis: { show: false },
      grid: { show: false, padding: { bottom: -27 } }
    },
    series = [
      { name: 'Quotations', data: quotations },
      { name: 'Invoices', data: invoices }
    ]

  return (
    <Card className='h-100'>
      <CardHeader className='pb-1'>
        <div>
          <CardTitle className='mb-25' tag='h4'>
            Sales
          </CardTitle>
          <CardText>Last 6 months</CardText>
        </div>
      </CardHeader>

      <CardBody>
        <div className='d-inline-block me-1'>
          <div className='d-flex align-items-center'>
            <Circle size={13} className='text-primary me-50' />
            <h6 className='mb-0'>Quotations</h6>
          </div>
        </div>
        <div className='d-inline-block'>
          <div className='d-flex align-items-center'>
            <Circle size={13} className='text-info me-50' />
            <h6 className='mb-0'>Invoices</h6>
          </div>
        </div>
        <Chart options={options} series={series} type='radar' height={300} />
      </CardBody>
    </Card>
  )
}

export default SalesRadarCard
