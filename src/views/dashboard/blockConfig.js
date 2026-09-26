import { DollarSign, FileText, Edit3, Users, Briefcase, Clock, CheckCircle } from 'react-feather'
import { formatAmount } from '@utils'

// Keep block ids and section names aligned with the API and permissions menu.
// Donut blocks in the same section are rendered together by the chart card.
export const dashboardBlocks = [
  {
    id: 'invoiceApp',
    section: 'Billing',
    title: 'Invoices',
    icon: DollarSign,
    color: 'primary',
    path: '/invoice',
    chart: 'donut',
    byStatusKey: 'by_status',
    extraStats: data => [
      { label: 'Revenue this month', value: formatAmount(data.revenue_this_month) },
      { label: 'Overdue', value: data.overdue_count }
    ]
  },
  {
    id: 'quotations',
    section: 'Billing',
    title: 'Quotations',
    icon: FileText,
    color: 'info',
    path: '/quotation',
    chart: 'donut',
    byStatusKey: 'by_status',
    extraStats: () => []
  },
  {
    id: 'projects',
    section: 'Billing',
    title: 'Projects',
    icon: Briefcase,
    color: 'secondary',
    path: '/project',
    chart: 'donut',
    byStatusKey: 'by_status',
    extraStats: () => []
  },
  {
    id: 'contracts',
    section: 'Billing',
    title: 'Contracts',
    icon: Edit3,
    color: 'success',
    path: '/contract',
    stats: data => [
      { label: 'Active', value: data.active },
      { label: 'Total', value: data.total }
    ]
  },
  {
    id: 'clients',
    section: 'Billing',
    title: 'Clients',
    icon: Users,
    color: 'warning',
    path: '/client',
    stats: data => [{ label: 'Total clients', value: data.total }]
  },
  {
    id: 'timesheets',
    section: 'Apps & Pages',
    title: 'Timesheet',
    icon: Clock,
    color: 'success',
    path: '/timesheet',
    stats: data => [{ label: 'Hours this week', value: formatAmount(data.hours_this_week) }]
  },
  {
    id: 'leave',
    section: 'Apps & Pages',
    title: 'Leave',
    icon: CheckCircle,
    color: 'info',
    path: '/my-leave',
    stats: data => [
      { label: 'My remaining PL', value: data.my_remaining_pl },
      { label: 'Pending approvals', value: data.pending_approvals_count }
    ]
  }
]

export const dashboardSections = ['Billing', 'Apps & Pages']
