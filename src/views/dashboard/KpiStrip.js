import { DollarSign, CheckSquare, Mail, Clock } from 'react-feather'
import { Row, Col, Card, CardBody } from 'reactstrap'
import { formatAmount } from '@utils'

// Headline numbers derived client-side from blocks already fetched (no
// extra request) - each KPI only appears if at least one of its source
// blocks is present, i.e. the viewer's role can actually see that data.
// Same "never invent a number" rule as the rest of the dashboard: a KPI
// with no visible source block is omitted, not shown as 0.
const buildKpis = blocks => {
  const kpis = []

  if (blocks.invoiceApp) {
    kpis.push({
      icon: DollarSign,
      color: 'primary',
      label: 'Outstanding Balance',
      value: formatAmount(blocks.invoiceApp.outstanding_balance)
    })
  }

  if (blocks.todo) {
    kpis.push({ icon: CheckSquare, color: 'info', label: 'Open Tasks', value: blocks.todo.pending || 0 })
  }

  if (blocks.contactSubmissions || blocks.jobApplications) {
    const unread = (blocks.contactSubmissions?.unread || 0) + (blocks.jobApplications?.unread || 0)
    kpis.push({ icon: Mail, color: 'warning', label: 'Unread Enquiries', value: unread })
  }

  if (blocks.timesheets) {
    kpis.push({
      icon: Clock,
      color: 'success',
      label: 'Hours This Week',
      value: formatAmount(blocks.timesheets.hours_this_week)
    })
  }

  return kpis
}

const KpiStrip = ({ blocks }) => {
  const kpis = buildKpis(blocks)
  if (kpis.length === 0) return null

  // Fills the row whatever the count is (1-4 KPIs, gated by role/permissions
  // above) instead of a fixed md={3} that leaves a dangling empty gutter
  // when fewer than 4 apply to this viewer.
  const colWidth = 12 / kpis.length

  return (
    <Row className='g-2 mb-1'>
      {kpis.map((kpi, index) => (
        <Col md={colWidth} sm={6} key={index}>
          <Card className='mb-0 h-100'>
            <CardBody className='d-flex align-items-center'>
              <div className={`avatar avatar-stats p-50 m-0 me-2 bg-light-${kpi.color}`}>
                <div className='avatar-content'>
                  <kpi.icon size={22} />
                </div>
              </div>
              <div>
                <h3 className='fw-bolder mb-0'>{kpi.value}</h3>
                <p className='card-text text-muted mb-0'>{kpi.label}</p>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default KpiStrip
