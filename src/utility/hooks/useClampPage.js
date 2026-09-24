import { useEffect } from 'react'

// Deleting the last row(s) on the last page of a server-paginated list
// leaves currentPage pointing past the end - the refetch comes back empty
// while `total` says records still exist. Steps back to the new last page
// instead of showing "There are no records to display". A genuinely empty
// list (total 0) or page 1 is left alone.
const useClampPage = ({ data, total, currentPage, rowsPerPage, setCurrentPage }) => {
  useEffect(() => {
    if (data.length === 0 && total > 0 && currentPage > 1) {
      setCurrentPage(Math.max(1, Math.ceil(total / rowsPerPage)))
    }
  }, [data, total])
}

export default useClampPage
