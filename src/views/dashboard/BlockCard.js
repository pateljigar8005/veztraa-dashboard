import { Link } from 'react-router-dom'
import { Card, CardBody } from 'reactstrap'

// Same avatar-stats + bg-light-{color} shape as the Invoice Report page's
// own StatCard (src/views/apps/reports/invoice-report/index.js). h-100 so
// every card in a grid row matches the row's tallest card instead of
// leaving ragged bottoms.
//
// `items` (optional) - a short list of the actual records behind the
// headline stat (e.g. Contact Us's latest unread submitters), rendered
// below it so the number is something to act on, not just a count.
const BlockCard = ({ icon: Icon, color, title, path, stats, items = [] }) => (
  <Card className='h-100'>
    <CardBody>
      <div className='d-flex align-items-center justify-content-between mb-1'>
        <div className='d-flex align-items-center'>
          <div className={`avatar avatar-stats p-50 m-0 me-2 bg-light-${color}`}>
            <div className='avatar-content'>
              <Icon size={22} />
            </div>
          </div>
          <h5 className='mb-0'>{title}</h5>
        </div>
        <Link to={path} className='text-nowrap'>
          View all
        </Link>
      </div>
      {stats.length === 0 ? (
        <p className='text-muted mb-0'>No data yet</p>
      ) : stats.length === 1 ? (
        <h2 className='fw-bolder mb-0'>{stats[0].value}</h2>
      ) : (
        stats.map((stat, index) => (
          <div key={index} className='d-flex align-items-center justify-content-between py-25'>
            <span className='text-muted text-capitalize'>{stat.label}</span>
            <span className='fw-bolder'>{stat.value}</span>
          </div>
        ))
      )}
      {stats.length === 1 && <p className='text-muted mb-0'>{stats[0].label}</p>}
      {items.length > 0 && (
        <div className='mt-1 pt-1 border-top'>
          {items.map(item => (
            <Link key={item.id} to={path} className='d-flex align-items-center justify-content-between py-25 text-body'>
              <span className='text-truncate pe-1'>{item.label}</span>
              {item.sub && <span className='text-muted text-nowrap small'>{item.sub}</span>}
            </Link>
          ))}
        </div>
      )}
    </CardBody>
  </Card>
)

export default BlockCard
