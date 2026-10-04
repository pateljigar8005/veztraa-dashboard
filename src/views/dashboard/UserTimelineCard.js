import { Link } from 'react-router-dom'
import { List, MoreVertical } from 'react-feather'
import { Card, CardHeader, CardTitle, CardBody, Badge } from 'reactstrap'
import Timeline from '@components/timeline'
import { priorityColors } from '../apps/todo/todoOptions'
import { TYPE_META, relativeLabel, invoiceCustomContent } from './upcomingTimelineItems'

// User Timeline card - merged todo/calendar/holiday/invoice feed, with its
// own plain glowing-dot rendering (no icon inside the circle, except for
// holidays below) to match this card's original look. The sidebar Upcoming
// block was removed as a duplicate of this exact same feed.
const toTimelineItem = item => {
  const meta = TYPE_META[item.type]
  return {
    title: (
      <Link to={meta.path(item.id)} className='text-body'>
        {item.title}
      </Link>
    ),
    meta: item.overdue ? 'Overdue' : relativeLabel(item.date),
    metaClassName: item.overdue ? 'text-danger fw-bolder' : '',
    color: item.overdue ? 'danger' : item.color || meta.color,
    // Holidays repeat the same plain "Holiday" content line item after
    // item - the icon gives them a bit more visual identity than a plain
    // gray dot, without changing the plain-dot look for the other types.
    icon: item.type === 'holiday' ? meta.icon : undefined,
    content: (
      <span className='text-muted'>
        {meta.label}
        {item.meta && (
          <Badge color={priorityColors[item.meta] || 'secondary'} pill className='text-capitalize ms-50'>
            {item.meta}
          </Badge>
        )}
      </span>
    ),
    customContent: item.type === 'invoice' ? invoiceCustomContent(item) : undefined
  }
}

const UserTimelineCard = ({ data = [] }) => {
  const items = data.filter(item => TYPE_META[item.type]).map(toTimelineItem)

  return (
    <Card className='card-user-timeline h-100'>
      <CardHeader>
        <div className='d-flex align-items-center'>
          <List className='user-timeline-title-icon' />
          <CardTitle tag='h4'>User Timeline</CardTitle>
        </div>
        <MoreVertical size={18} className='cursor-pointer' />
      </CardHeader>
      <CardBody>
        {items.length > 0 ? (
          <Timeline className='ms-50 mb-0' data={items} />
        ) : (
          <p className='text-muted mb-0'>Nothing coming up this week.</p>
        )}
      </CardBody>
    </Card>
  )
}

export default UserTimelineCard
