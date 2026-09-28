// Small icon + text empty state for dashboard widget cards, matching the
// look of TableEmptyState (avatar-content icon + muted text) but sized
// down to sit inside a Card body instead of a full table.
const CardEmptyState = ({ icon: Icon, message = 'No data yet' }) => (
  <div className='d-flex flex-column align-items-center text-center py-1'>
    <div className='avatar avatar-md bg-light-secondary mb-50'>
      <div className='avatar-content'>
        <Icon size={20} />
      </div>
    </div>
    <p className='text-muted mb-0'>{message}</p>
  </div>
)

export default CardEmptyState
