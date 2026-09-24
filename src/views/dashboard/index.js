import { Fragment, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Spinner } from 'reactstrap'
import { getSummary } from './store'
import { dashboardBlocks, dashboardSections } from './blockConfig'
import BlockCard from './BlockCard'
import CombinedChartCard from './CombinedChartCard'
import UpcomingCard from './UpcomingCard'
import KpiStrip from './KpiStrip'

// One block's config + its already-fetched data in -> a BlockCard. Donut-
// flagged blocks (Invoice/Quotation/Project) are handled separately in the
// section loop below - they combine into one CombinedChartCard instead of
// a card each, so they never reach here.
const renderBlockCard = (block, data) => (
  <BlockCard
    icon={block.icon}
    color={block.color}
    title={block.title}
    path={block.path}
    stats={block.stats(data)}
    items={block.items ? block.items(data) : []}
  />
)

// Personalized per role: DashboardController::summary() on the API side
// already omits any block the current role can't view (admin gets all of
// them) and scopes Todo/Timesheet/Calendar to the caller's own
// records for a non-admin - this just renders whatever came back, grouped
// under the same Billing/Apps & Pages/Website sections the Roles &
// Permissions matrix already uses (dashboardSections). A section with no
// visible blocks in it is skipped entirely, so a role with only e.g. Todo
// access sees one lean "Apps & Pages" section, not two empty headers.
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
        <div className='d-flex justify-content-center p-5'>
          <Spinner color='primary' />
        </div>
      ) : visibleBlocks.length === 0 && store.upcoming.length === 0 ? (
        <p className='text-muted'>Nothing to show here yet.</p>
      ) : (
        <Fragment>
          <KpiStrip blocks={store.blocks} />

          <Row className='g-2'>
            <Col lg={4} md={12} className='order-lg-2'>
              <h6 className='text-muted text-uppercase mb-1'>Upcoming</h6>
              <UpcomingCard items={store.upcoming} />
            </Col>
            <Col lg={8} md={12} className='order-lg-1'>
              {dashboardSections.map(section => {
                const sectionBlocks = visibleBlocks.filter(block => block.section === section)
                if (sectionBlocks.length === 0) return null

                const donutBlocks = sectionBlocks.filter(block => block.chart === 'donut')
                const otherBlocks = sectionBlocks.filter(block => block.chart !== 'donut')

                return (
                  <div key={section} className='mb-2'>
                    <h6 className='text-muted text-uppercase mb-1'>{section}</h6>
                    <Row className='g-2'>
                      {donutBlocks.length > 0 && (
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
                      )}
                      {/* Fills the row whatever the count is, same reasoning as
                          KpiStrip's own colWidth - a lone leftover card (e.g.
                          just Timesheet in Apps & Pages now that Todo/Calendar
                          moved into Upcoming) takes the full row
                          instead of leaving a dangling empty half. */}
                      {otherBlocks.map(block => (
                        <Col md={12 / otherBlocks.length} key={block.id}>
                          {renderBlockCard(block, store.blocks[block.id])}
                        </Col>
                      ))}
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
