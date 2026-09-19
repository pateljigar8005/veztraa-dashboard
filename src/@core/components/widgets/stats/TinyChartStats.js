import PropTypes from 'prop-types'
import Chart from 'react-apexcharts'
import { Card, CardBody } from 'reactstrap'

const TinyChartStats = props => {
  const { title, stats, options, series, type, height } = props

  return (
    <Card className='card-tiny-line-stats'>
      <CardBody className='pb-50'>
        <h6>{title}</h6>
        <h2 className='fw-bolder mb-1'>{stats}</h2>
        <Chart options={options} series={series} type={type} height={height} />
      </CardBody>
    </Card>
  )
}

export default TinyChartStats

TinyChartStats.propTypes = {
  type: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  stats: PropTypes.string.isRequired,
  series: PropTypes.array.isRequired,
  options: PropTypes.object.isRequired
}

TinyChartStats.defaultProps = {
  height: 100
}