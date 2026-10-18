import { Fragment, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Button } from 'reactstrap'
import { Grid, AlertTriangle, RefreshCw } from 'react-feather'
import { getSummary } from './store'
import CardEmptyState from '@src/views/apps/shared/CardEmptyState'
import { dashboardBlocks, dashboardSections } from './blockConfig'
import DashboardSkeleton from './DashboardSkeleton'
import CombinedChartCard from './CombinedChartCard'
import KpiStrip from './KpiStrip'
import SupportTrackerCard from './SupportTrackerCard'
import RevenueReportCard from './RevenueReportCard'
import UserTimelineCard from './UserTimelineCard'
import SalesRadarCard from './SalesRadarCard'
import NeedsAttentionCard from './NeedsAttentionCard'

// Personalized per role: DashboardController::summary() on the API side
// already omits any block the current role can't view (admin gets all of
// them) - this just renders whatever came back. Every remaining
// dashboardBlocks entry is a donut block (Contracts/Clients/Timesheet/Leave
// were removed as redundant, no longer rendered anywhere), grouped under the
// Billing section the Roles & Permissions matrix also uses. A section with
// no visible blocks in it is skipped entirely.
const Dashboard = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.dashboard)

  useEffect(() => {
    dispatch(getSummary())
  }, [dispatch])

  const visibleBlocks = dashboardBlocks.filter(block => store.blocks[block.id])

  return (
    <Fragment>
      {store.loading ? (
        <DashboardSkeleton />
      ) : store.error && visibleBlocks.length === 0 && store.upcoming.length === 0 ? (
        // Only shown when there's nothing left over from a previous
        // successful load to fall back on - a failed background refresh
        // with stale data already on screen just keeps showing that
        // instead of replacing it with an error.
        <CardEmptyState
          icon={AlertTriangle}
          message="Couldn't load the dashboard - check your connection and try again."
          action={
            <Button color='primary' size='sm' className='mt-1' onClick={() => dispatch(getSummary())}>
              <RefreshCw size={14} className='me-50' /> Retry
            </Button>
          }
        />
      ) : visibleBlocks.length === 0 && store.upcoming.length === 0 ? (
        <CardEmptyState icon={Grid} message='Nothing to show here yet' />
      ) : (
        <Fragment>
          <KpiStrip blocks={store.blocks} reportCurrencyIcon={store.reportCurrencyIcon} />

          {(store.blocks.revenueReport || store.blocks.supportTracker) && (
            <Row className='g-2 mb-2'>
              {store.blocks.revenueReport && (
                <Col md={store.blocks.supportTracker ? 6 : 12}>
                  <RevenueReportCard data={store.blocks.revenueReport} currencyIcon={store.reportCurrencyIcon} />
                </Col>
              )}
              {store.blocks.supportTracker && (
                <Col md={store.blocks.revenueReport ? 6 : 12}>
                  <SupportTrackerCard data={store.blocks.supportTracker} />
                </Col>
              )}
            </Row>
          )}

          <Row className='g-2 mb-2'>
            {store.blocks.upcomingEvents && (
              <Col lg={4} md={6} xs={12}>
                <UserTimelineCard data={store.blocks.upcomingEvents.items} />
              </Col>
            )}
            {store.blocks.salesRadar && (
              <Col lg={4} md={6} xs={12}>
                <SalesRadarCard data={store.blocks.salesRadar} />
              </Col>
            )}
            <Col lg={4} md={12} xs={12}>
              <NeedsAttentionCard />
            </Col>
          </Row>

          <Row className='g-2'>
            <Col md={12}>
              {/* Donut blocks (Invoices/Quotations/Projects) still render
                  per-section, since a CombinedChartCard groups them by
                  section on purpose (e.g. all of Billing's own donuts
                  together) and merging across sections wouldn't make sense
                  for a single chart. */}
              {dashboardSections.map(section => {
                const donutBlocks = visibleBlocks.filter(
                  block => block.section === section && block.chart === 'donut'
                )
                if (donutBlocks.length === 0) return null

                return (
                  <div key={section} className='mb-2'>
                    <h6 className='text-muted text-uppercase mb-1'>{section}</h6>
                    <Row className='g-2'>
                      <Col md={12}>
                        <CombinedChartCard
                          items={donutBlocks.map(block => {
                            const data = store.blocks[block.id]
                            return {
                              icon: block.icon,
                              color: block.color,
                              title: block.title,
                              path: block.path,
                              byStatus: data[block.byStatusKey],
                              extraStats: block.extraStats(data)
                            }
                          })}
                        />
                      </Col>
                    </Row>
                  </div>
                )
              })}
            </Col>
          </Row>
        </Fragment>
      )}
    </Fragment>
  )
}

export default Dashboard
