import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Card, CardHeader, CardTitle, CardBody, Badge } from 'reactstrap'
import { Bell, Mail, Briefcase, AlertCircle, CheckSquare, MessageSquare, Calendar, CheckCircle, FileText } from 'react-feather'
import Timeline from '@components/timeline'
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
  contact: { icon: <Mail size={12} />, color: 'primary' },
  job_application: { icon: <Briefcase size={12} />, color: 'info' },
  todo_overdue: { icon: <AlertCircle size={12} />, color: 'danger' },
  todo_assigned: { icon: <CheckSquare size={12} />, color: 'warning' },
  mention: { icon: <MessageSquare size={12} />, color: 'secondary' },
  leave_pending: { icon: <Calendar size={12} />, color: 'warning' },
  leave_decided: { icon: <CheckCircle size={12} />, color: 'success' },
  invoice_overdue: { icon: <FileText size={12} />, color: 'danger' }
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

  const timelineItems = items.slice(0, MAX_ITEMS).map(item => {
    const meta = TYPE_META[item.type] || { icon: <Bell size={12} />, color: 'secondary' }
    return {
      title: (
        <Link to={item.path} className='text-body'>
          {item.title}
        </Link>
      ),
      meta: formatRelativeDate(item.date),
      color: meta.color,
      icon: meta.icon,
      content: <span className='text-muted'>{item.subtitle}</span>
    }
  })

  return (
    <Card className='h-100'>
      <CardHeader>
        <div className='d-flex align-items-center'>
          <Bell size={18} className='me-50' />
          <CardTitle tag='h4'>Needs Your Attention</CardTitle>
        </div>
        {count > 0 && (
          <Badge color='danger' pill>
            {count}
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        {loading ? (
          <p className='text-muted mb-0'>Loading...</p>
        ) : timelineItems.length > 0 ? (
          <Timeline className='ms-50 mb-0' data={timelineItems} />
        ) : (
          <p className='text-muted mb-0'>You're all caught up.</p>
        )}
      </CardBody>
    </Card>
  )
}

export default NeedsAttentionCard
