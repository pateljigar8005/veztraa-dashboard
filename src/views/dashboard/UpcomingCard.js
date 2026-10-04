import { Coffee } from 'react-feather'
import { Card, CardBody } from 'reactstrap'
import Timeline from '@components/timeline'
import { toUpcomingTimelineItems } from './upcomingTimelineItems'

// The API returns one sorted list of upcoming todos, events, and holidays.
// Keep these items in the timeline so overdue work has one obvious home.
const UpcomingCard = ({ items }) => (
  <Card className='mb-1'>
    <CardBody style={{ maxHeight: 'calc(100vh - 9rem)', overflowY: 'auto' }}>
      {items.length === 0 ? (
        <div className='d-flex flex-column align-items-center text-center py-2'>
          <div className='avatar avatar-xl bg-light-secondary mb-1'>
            <div className='avatar-content'>
              <Coffee size={26} />
            </div>
          </div>
          <p className='text-muted mb-0'>Nothing coming up this week. Enjoy the calm.</p>
        </div>
      ) : (
        <Timeline data={toUpcomingTimelineItems(items)} />
      )}
    </CardBody>
  </Card>
)

export default UpcomingCard
