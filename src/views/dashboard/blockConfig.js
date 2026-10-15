import { DollarSign, FileText, Briefcase } from 'react-feather'
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
  }
]

export const dashboardSections = ['Billing']
