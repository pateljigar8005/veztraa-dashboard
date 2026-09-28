import Skeleton from '.'

// A handful of generic table-row placeholders: `columns` widths (in %) let a
// caller loosely match its own column layout without needing full column defs.
const TableRowsSkeleton = ({ rows = 5, columns = [30, 40, 15, 15] }) => (
  <div className='px-1 py-50'>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className='d-flex align-items-center py-75' style={{ gap: '1rem' }}>
        {columns.map((width, colIndex) => (
          <Skeleton key={colIndex} width={`${width}%`} height={14} />
        ))}
      </div>
    ))}
  </div>
)

export default TableRowsSkeleton
