import { Card, CardHeader, CardBody } from 'reactstrap'
import Skeleton from '@components/skeleton'

// Mirrors MailDetails' own shape: subject header, then a card with the
// correspondent avatar + name/date row, then a few body lines.
const MailDetailsSkeleton = () => (
  <div className='p-2'>
    <div className='d-flex align-items-center mb-2'>
      <Skeleton width='45%' height={20} />
    </div>
    <Card className='mb-2'>
      <CardHeader className='email-detail-head'>
        <div className='user-details d-flex align-items-center flex-wrap'>
          <Skeleton circle width={48} height={48} className='me-75' />
          <div>
            <Skeleton width={140} height={16} className='mb-50' />
            <Skeleton width={100} height={12} />
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <Skeleton width='100%' height={12} className='mb-50' />
        <Skeleton width='95%' height={12} className='mb-50' />
        <Skeleton width='90%' height={12} className='mb-50' />
        <Skeleton width='60%' height={12} />
      </CardBody>
    </Card>
  </div>
)

export default MailDetailsSkeleton
