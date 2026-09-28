import { Fragment } from 'react'
import { Row, Col, Card, CardBody } from 'reactstrap'
import Skeleton from '@components/skeleton'

// Mirrors the real dashboard's grid (KpiStrip -> Revenue/SupportTracker row
// -> 3-card row -> section cards + Upcoming sidebar) so there's no layout
// jump when the fetched data swaps in. Card counts are fixed guesses (4 KPIs,
// 3 block cards) rather than driven by data we don't have yet - close enough
// for a loading placeholder, and it disappears as soon as getSummary resolves.
const StatCardSkeleton = () => (
  <Card className='mb-0 h-100'>
    <CardBody className='d-flex align-items-center'>
      <Skeleton circle width={44} height={44} className='me-2' />
      <div className='flex-grow-1'>
        <Skeleton width='60%' height={20} className='mb-50' />
        <Skeleton width='80%' height={12} />
      </div>
    </CardBody>
  </Card>
)

const BlockCardSkeleton = () => (
  <Card className='h-100'>
    <CardBody>
      <div className='d-flex align-items-center justify-content-between mb-1'>
        <div className='d-flex align-items-center'>
          <Skeleton circle width={38} height={38} className='me-2' />
          <Skeleton width={90} height={16} />
        </div>
        <Skeleton width={50} height={12} />
      </div>
      <Skeleton width='40%' height={26} className='mb-50' />
      <Skeleton width='70%' height={12} />
    </CardBody>
  </Card>
)

const ChartCardSkeleton = ({ height = 220 }) => (
  <Card className='h-100 mb-0'>
    <CardBody>
      <Skeleton width={140} height={16} className='mb-1' />
      <Skeleton width='100%' height={height} />
    </CardBody>
  </Card>
)

const UpcomingCardSkeleton = () => (
  <Card className='mb-1'>
    <CardBody>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className='d-flex align-items-start mb-1'>
          <Skeleton circle width={24} height={24} className='me-1 mt-25' />
          <div className='flex-grow-1'>
            <Skeleton width='75%' height={12} className='mb-50' />
            <Skeleton width='40%' height={10} />
          </div>
        </div>
      ))}
    </CardBody>
  </Card>
)

const DashboardSkeleton = () => (
  <Fragment>
    <Row className='g-2 mb-1'>
      {[0, 1, 2, 3].map(i => (
        <Col md={3} sm={6} key={i}>
          <StatCardSkeleton />
        </Col>
      ))}
    </Row>

    <Row className='g-2 mb-1'>
      <Col md={6}>
        <ChartCardSkeleton height={260} />
      </Col>
      <Col md={6}>
        <ChartCardSkeleton height={260} />
      </Col>
    </Row>

    <Row className='g-2 mb-1'>
      {[0, 1, 2].map(i => (
        <Col lg={4} md={6} xs={12} key={i}>
          <ChartCardSkeleton height={180} />
        </Col>
      ))}
    </Row>

    <Row className='g-2'>
      <Col lg={4} md={12} className='order-lg-2'>
        <Skeleton width={90} height={14} className='mb-1' />
        <UpcomingCardSkeleton />
      </Col>
      <Col lg={8} md={12} className='order-lg-1'>
        <Skeleton width={120} height={14} className='mb-1' />
        <Row className='g-2'>
          {[0, 1, 2].map(i => (
            <Col md={4} key={i}>
              <BlockCardSkeleton />
            </Col>
          ))}
        </Row>
      </Col>
    </Row>
  </Fragment>
)

export default DashboardSkeleton
