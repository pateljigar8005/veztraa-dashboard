import Skeleton from '@components/skeleton'

// Mirrors MailCard's row shape (avatar + name/subject line + date column)
// so the list doesn't jump when real rows swap in.
const MailListSkeleton = () => (
  <ul className='email-media-list'>
    {[0, 1, 2, 3, 4, 5].map(i => (
      <li key={i} className='d-flex user-mail'>
        <div className='mail-left pe-50'>
          <Skeleton circle width={40} height={40} />
        </div>
        <div className='mail-body flex-grow-1'>
          <div className='mail-details'>
            <div className='mail-items flex-grow-1'>
              <Skeleton width='35%' height={14} className='mb-50' />
              <Skeleton width='65%' height={12} />
            </div>
            <div className='mail-meta-item'>
              <Skeleton width={50} height={10} />
            </div>
          </div>
        </div>
      </li>
    ))}
  </ul>
)

export default MailListSkeleton
