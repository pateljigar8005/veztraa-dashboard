import { DollarSign, FileText, Edit3, Users, Briefcase, Clock, Mail, Send } from 'react-feather'
import { formatAmount } from '@utils'

// One entry per dashboard block id - the same ids DashboardController::summary()
// uses server-side and navPermissions.js's routeToMenuId already uses for
// routing/menu visibility. A block id with no matching key in the store's
// `blocks` (i.e. the viewer can't see that module) is simply not rendered -
// see index.js.
//
// `section` groups blocks under the same three section labels the Roles &
// Permissions matrix already uses (menuPermissions.js's menuPermissionGroups)
// instead of inventing new vocabulary - "Billing" here is the same Billing a
// role's permissions are edited under.
//
// `chart: 'donut'` blocks carry a real status breakdown (Invoice/Quotation/
// Project all have a `status` column) - all of a section's donut blocks
// combine into one shared CombinedChartCard instead of a card each (see
// index.js). Everything else here is a plain BlockCard.
//
// Kanban, Todo, Calendar, and Holidays deliberately have no card here -
// they're all "things with a due date/start time", and every one of them
// (overdue and upcoming alike) already lives in the Upcoming timeline
// (UpcomingCard) instead, so there's exactly one place to check for what
// needs attention rather than the same task also living in a separate
// summary card.
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
    // Outstanding balance is already the KPI strip's headline number -
    // shown once there, not repeated here.
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
    id: 'contactSubmissions',
    section: 'Website',
    title: 'Contact Us',
    icon: Mail,
    color: 'primary',
    path: '/contact-submission',
    stats: data => [{ label: 'Unread', value: data.unread }],
    items: data => (data.recent || []).map(r => ({ id: r.id, label: r.name, sub: r.reference_id }))
  },
  {
    id: 'jobApplications',
    section: 'Website',
    title: 'Job Applications',
    icon: Send,
    color: 'info',
    path: '/job-application',
    stats: data => [{ label: 'Unread', value: data.unread }],
    items: data => (data.recent || []).map(r => ({ id: r.id, label: r.name, sub: r.reference_id }))
  }
]

export const dashboardSections = ['Billing', 'Apps & Pages', 'Website']
