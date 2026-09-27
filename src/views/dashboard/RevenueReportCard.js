import { useContext } from 'react'

// ** Third Party Components
import Chart from 'react-apexcharts'

// ** Reactstrap Imports
import { Row, Col, Card, CardTitle } from 'reactstrap'

import { ThemeColors } from '@src/utility/context/ThemeColors'

// Port of Vuexy's "Revenue Report" analytics card
// (react-version/vite-bootstrap5/full-version/.../RevenueReport.js), minus
// the budget side panel (removed per request). Numbers are the template's
// own static demo data - wiring this to real revenue/expense figures is a
// follow-up.
const RevenueReportCard = () => {
  const { colors } = useContext(ThemeColors)
  const primary = colors?.primary?.main || '#7367f0'
  const warning = colors?.warning?.main || '#ff9f43'

  const revenueOptions = {
      chart: {
        stacked: true,
        type: 'bar',
        toolbar: { show: false }
      },
      grid: {
        padding: { top: -20, bottom: -10 },
        yaxis: { lines: { show: false } }
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        labels: { style: { colors: '#b9b9c3', fontSize: '0.86rem' } },
        axisTicks: { show: false },
        axisBorder: { show: false }
      },
      legend: { show: false },
      dataLabels: { enabled: false },
      colors: [primary, warning],
      plotOptions: {
        bar: {
          columnWidth: '17%',
          borderRadius: [4],
          borderRadiusWhenStacked: 'all',
          borderRadiusApplication: 'start'
        },
        distributed: true
      },
      yaxis: {
        labels: { style: { colors: '#b9b9c3', fontSize: '0.86rem' } }
      }
    },
    revenueSeries = [
      { name: 'Earning', data: [95, 177, 284, 256, 105, 63, 168, 218, 72] },
      { name: 'Expense', data: [-145, -80, -60, -180, -100, -60, -85, -75, -100] }
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
                <span>Earning</span>
              </div>
              <div className='d-flex align-items-center'>
                <span className='bullet bullet-warning me-50 cursor-pointer'></span>
                <span>Expense</span>
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
