import { Link } from 'react-router-dom'
import { Trello, CheckSquare, Calendar, Gift, Coffee } from 'react-feather'
import { Card, CardBody, Badge } from 'reactstrap'
import Timeline from '@components/timeline'
import { priorityColors } from '../apps/kanban/kanbanOptions'

// Merged, date-sorted timeline from DashboardController::summary()'s
// `upcoming` array - Kanban tasks/Todos (both overdue and due this week),
// Calendar events starting soon, and upcoming Holidays, already permission-
// and own-records-scoped server-side (see that endpoint's own comment).
// This is the one place Kanban/Todo/Calendar items show up on the
// dashboard - they have no separate summary card of their own (see
// blockConfig.js's own note) specifically so an overdue task can't be
// missed by only living in a stat nobody happens to look at. Rendered with
// the theme's own Timeline component (src/@core/components/timeline)
// rather than a plain list, for the connecting-line/dot look already used
// elsewhere in this Vuexy theme.
const TYPE_META = {
  kanban: { icon: <Trello size={12} />, color: 'primary', path: '/kanban', label: 'Kanban task' },
  todo: { icon: <CheckSquare size={12} />, color: 'info', path: '/todo', label: 'Todo' },
  calendar: { icon: <Calendar size={12} />, color: 'warning', path: '/calendar', label: 'Event' },
  holiday: { icon: <Gift size={12} />, color: 'secondary', path: '/holiday', label: 'Holiday' }
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

// No title inside the card itself - it's an external label the same
// text-muted text-uppercase heading the section groups use (see index.js),
// so its card starts at the same y-position as the section card rows next
// to it instead of sitting higher because of an in-card title they don't
// have.
//
// Not sticky - position: sticky here fights this app's own navbar stacking
// context and overlaps it (same issue the Calendar sidebar hit earlier and
// had reverted for). It stays in normal flow; its own max-height + scroll
// still keeps it from growing taller than the viewport.
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
                <Link to={meta.path} className='text-body'>
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
