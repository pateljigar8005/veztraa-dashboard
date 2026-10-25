import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Card, CardHeader, CardTitle, CardBody, Badge } from 'reactstrap'
import { Bell, Mail, Briefcase, AlertCircle, CheckSquare, MessageSquare, Calendar, CheckCircle, FileText, ChevronRight } from 'react-feather'
import Avatar from '@components/avatar'
import Skeleton from '@components/skeleton'
import { formatRelativeDate } from '@utils'

// Replaces the old "App design" card (CardAppDesign - Vuexy's static demo
// project, never wired to real data, see git history for AppDesignCard.js).
// Reuses GET /notifications as-is rather than a new dashboard-specific
// endpoint - NotificationController::index() already computes exactly this
// (overdue todos/invoices, pending leave approvals, unread contact/job
// submissions, @mentions) for the navbar bell; this just renders the same
// response as a card instead of a dropdown. Some overlap with the adjacent
// User Timeline card's overdue todos/invoices is expected and fine - the
// real new value here is the non-date-shaped items (mentions, pending leave
// approvals, new submissions) that Timeline never shows.
const TYPE_META = {
  contact: { icon: <Mail size={16} />, color: 'primary' },
  job_application: { icon: <Briefcase size={16} />, color: 'info' },
  todo_overdue: { icon: <AlertCircle size={16} />, color: 'danger' },
  todo_assigned: { icon: <CheckSquare size={16} />, color: 'warning' },
  mention: { icon: <MessageSquare size={16} />, color: 'secondary' },
  leave_pending: { icon: <Calendar size={16} />, color: 'warning' },
  leave_decided: { icon: <CheckCircle size={16} />, color: 'success' },
  invoice_overdue: { icon: <FileText size={16} />, color: 'danger' }
}

const MAX_ITEMS = 6

const NeedsAttentionCard = () => {
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get('/notifications')
      .then(response => {
        setItems(response.data?.data?.items || [])
        setCount(response.data?.data?.count || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const visibleItems = items.slice(0, MAX_ITEMS)

  return (
    <Card className='h-100'>
      <CardHeader>
        <div className='d-flex align-items-center'>
          <Bell size={18} className='me-50' />
          <CardTitle tag='h4'>Needs Your Attention</CardTitle>
        </div>
        {count > 0 && (
          <Badge color='light-danger' pill>
            {count} pending
          </Badge>
        )}
      </CardHeader>
      <CardBody className='d-flex flex-column'>
        {loading ? (
          [0, 1, 2, 3].map(i => (
            <div key={i} className='d-flex align-items-center mb-2'>
              <Skeleton circle width={38} height={38} className='me-1' />
              <div className='flex-grow-1'>
                <Skeleton width='70%' height={12} className='mb-50' />
                <Skeleton width='45%' height={10} />
              </div>
            </div>
          ))
        ) : visibleItems.length > 0 ? (
          <>
            {visibleItems.map((item, index) => {
              const meta = TYPE_META[item.type] || { icon: <Bell size={16} />, color: 'secondary' }
              return (
                <Link
                  key={`${item.type}-${index}`}
                  to={item.path}
                  className='d-flex align-items-center text-body py-75 border-bottom'
                >
                  <Avatar color={`light-${meta.color}`} icon={meta.icon} className='me-1 flex-shrink-0' />
                  <div className='flex-grow-1 overflow-hidden'>
                    <div className='d-flex justify-content-between align-items-center'>
                      <h6 className='mb-0 text-truncate'>{item.title}</h6>
                      <small className='text-muted ms-1 text-nowrap'>{formatRelativeDate(item.date)}</small>
                    </div>
                    {item.subtitle && <small className='text-muted d-block text-truncate'>{item.subtitle}</small>}
                  </div>
                  <ChevronRight size={16} className='text-muted ms-50 flex-shrink-0' />
                </Link>
              )
            })}
            {count > visibleItems.length && (
              <small className='text-muted text-center mt-1'>+{count - visibleItems.length} more in notifications</small>
            )}
          </>
        ) : (
          <div className='d-flex flex-column align-items-center justify-content-center text-center flex-grow-1 py-3'>
            <Avatar color='light-success' size='xl' icon={<CheckCircle size={28} />} className='mb-1' />
            <h5 className='mb-25'>You're all caught up</h5>
            <small className='text-muted' style={{ maxWidth: 260 }}>
              No overdue tasks or invoices, pending approvals, mentions or new enquiries right now.
            </small>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default NeedsAttentionCard
