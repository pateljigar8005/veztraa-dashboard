import classnames from 'classnames'
import './skeleton.scss'

// Generic shimmer block. Callers size it with width/height (number = px,
// string passed through as-is) rather than variant props, so the same
// primitive can stand in for a line of text, an avatar, a chart, etc. -
// see DashboardSkeleton / MailListSkeleton for composed layouts.
const Skeleton = ({ width, height, circle, className, style }) => (
  <span
    className={classnames('skeleton', { 'skeleton-circle': circle, 'skeleton-text': !circle && !width && !height }, className)}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style
    }}
  />
)

export default Skeleton
