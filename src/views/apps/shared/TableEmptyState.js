import { Search } from 'react-feather'
import './TableEmptyState.scss'

// True when any advanced-search filter actually has a value - filters
// objects keep cleared fields around as '' / null / [] rather than
// deleting the key.
export const hasActiveFilters = filters =>
  Object.values(filters || {}).some(value => value !== '' && value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0))

// noDataComponent for every list table. Two cases, worded differently on
// purpose: nothing exists yet, or the current search/filters simply
// exclude everything (say so, rather than implying the module is empty).
// Deliberately no Add button here - adding lives in the navbar's Add icon,
// not duplicated inside the table body.
const TableEmptyState = ({ icon: Icon, noun, message, filtered = false, filteredMessage }) => {
  const DisplayIcon = filtered ? Search : Icon

  return (
    <div className='table-empty-state d-flex flex-column align-items-center text-center py-4 px-2'>
      <div className='avatar avatar-xl bg-light-primary mb-1'>
        <div className='avatar-content'>
          <DisplayIcon size={28} />
        </div>
      </div>
      <h5 className='mb-50'>{filtered ? `No matching ${noun}` : `No ${noun} yet`}</h5>
      <p className='text-muted mb-0' style={{ maxWidth: 420 }}>
        {filtered ? filteredMessage || 'Nothing matches your current search or filters. Try adjusting or clearing them.' : message}
      </p>
    </div>
  )
}

export default TableEmptyState
