import { Link } from 'react-router-dom'
import { CheckSquare, Calendar, Gift, Coffee } from 'react-feather'
import { Card, CardBody, Badge } from 'reactstrap'
import Timeline from '@components/timeline'
import { priorityColors } from '../apps/todo/todoOptions'

// The API returns one sorted list of upcoming todos, events, and holidays.
// Keep these items in the timeline so overdue work has one obvious home.
const TYPE_META = {
  todo: { icon: <CheckSquare size={12} />, color: 'info', path: id => `/todo?task=${id}`, label: 'Todo' },
  calendar: { icon: <Calendar size={12} />, color: 'warning', path: () => '/calendar', label: 'Event' },
  holiday: { icon: <Gift size={12} />, color: 'secondary', path: id => `/holiday/edit/${id}`, label: 'Holiday' }
}

const relativeLabel = value => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(`${value}T00:00:00`)
  const days = Math.round((date - today) / 86400000)

  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1 && days < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

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
        <Timeline
          data={items.map(item => {
            const meta = TYPE_META[item.type]
            return {
              title: (
                <Link to={meta.path(item.id)} className='text-body'>
                  {item.title}
                </Link>
              ),
              meta: item.overdue ? 'Overdue' : relativeLabel(item.date),
              metaClassName: item.overdue ? 'text-danger fw-bolder' : '',
              color: item.overdue ? 'danger' : meta.color,
              icon: meta.icon,
              content: (
                <span className='text-muted'>
                  {meta.label}
                  {item.meta && (
                    <Badge color={priorityColors[item.meta] || 'secondary'} pill className='text-capitalize ms-50'>
                      {item.meta}
                    </Badge>
                  )}
                </span>
              )
            }
          })}
        />
      )}
    </CardBody>
  </Card>
)

export default UpcomingCard
