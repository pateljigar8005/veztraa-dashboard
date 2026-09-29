import { Row, Col, Card, CardBody, CardHeader } from 'reactstrap'
import Skeleton from '@components/skeleton'

// Shared by Invoice/Contract/Quotation's view pages - all three use the same
// "9-col main card + service item table + 3-col sticky details sidebar"
// layout, so one skeleton covers all of them instead of a spinner blanking
// the whole page while the record loads.
const DocumentViewSkeleton = () => (
  <Row>
    <Col xl={9} md={8} sm={12}>
      <Card>
        <CardBody>
          <div className='d-flex justify-content-between mb-2'>
            <div>
              <Skeleton width={160} height={22} className='mb-50' />
              <Skeleton width={220} height={14} />
            </div>
            <Skeleton width={90} height={36} />
          </div>
          <hr />
          <Skeleton width={80} height={16} className='mb-1' />
          <Row>
            {[0, 1, 2, 3].map(i => (
              <Col md={6} className='mb-1' key={i}>
                <Skeleton width={100} height={12} className='mb-50' />
                <Skeleton width='70%' height={14} />
              </Col>
            ))}
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton width={120} height={16} />
        </CardHeader>
        <CardBody>
          {[0, 1, 2].map(i => (
            <div key={i} className='d-flex align-items-center justify-content-between py-75' style={{ gap: '1rem' }}>
              <Skeleton width='45%' height={12} />
              <Skeleton width='10%' height={12} />
              <Skeleton width='15%' height={12} />
              <Skeleton width='15%' height={12} />
            </div>
          ))}
          <Row className='mt-1'>
            <Col md={{ size: 5, offset: 7 }}>
              <Skeleton width='100%' height={14} className='mb-50' />
              <Skeleton width='100%' height={14} className='mb-50' />
              <Skeleton width='100%' height={20} />
            </Col>
          </Row>
        </CardBody>
      </Card>
    </Col>

    <Col xl={3} md={4} sm={12}>
      <Card>
        <CardHeader>
          <Skeleton width={110} height={16} />
        </CardHeader>
        <CardBody>
          <Skeleton width={60} height={12} className='mb-50' />
          <Skeleton width='100%' height={38} className='mb-1' />
          <Skeleton width='100%' height={38} />
        </CardBody>
      </Card>
    </Col>
  </Row>
)

export default DocumentViewSkeleton
