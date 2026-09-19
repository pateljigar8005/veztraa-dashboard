import Avatar from '@components/avatar'
import PropTypes from 'prop-types'
import Chart from 'react-apexcharts'
import { Card, CardHeader, CardText } from 'reactstrap'
import { lineChartOptions } from './ChartOptions'

const StatsWithLineChart = ({ icon, color, stats, statTitle, series, options, type, height, ...rest }) => {
  return (
    <Card {...rest}>
      <CardHeader className='align-items-start pb-0'>
        <div>
          <h2 className='fw-bolder'>{stats}</h2>
          <CardText>{statTitle}</CardText>
        </div>
        <Avatar className='avatar-stats p-50 m-0' color={`light-${color}`} icon={icon} />
      </CardHeader>
      <Chart options={options} series={series} type={type} height={height ? height : 100} />
    </Card>
  )
}

export default StatsWithLineChart

StatsWithLineChart.propTypes = {
  type: PropTypes.string,
  height: PropTypes.string,
  options: PropTypes.object,
  icon: PropTypes.element.isRequired,
  color: PropTypes.string.isRequired,
  stats: PropTypes.string.isRequired,
  series: PropTypes.array.isRequired,
  statTitle: PropTypes.string.isRequired
}

StatsWithLineChart.defaultProps = {
  options: lineChartOptions,
  color: 'primary'
}