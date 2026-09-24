import { Link } from 'react-router-dom'

// "Quotation JC00013" / "Contract AJ00015" for an invoice created from one
// (see InvoiceController::serialize()'s quotation_*/contract_* fields).
// Linked to the source's own view page while it still exists; plain text
// once it's been deleted, since the number is still worth knowing.
const Reference = ({ label, number, id, exists, path }) => (
  <div className='text-nowrap'>
    <small className='text-muted'>{label} </small>
    {exists ? (
      <Link to={`/${path}/view/${id}`} onClick={e => e.stopPropagation()}>
        {number}
      </Link>
    ) : (
      <span title={`${label} deleted`}>{number}</span>
    )}
  </div>
)

const SourceReference = ({ invoice, empty = null }) => {
  if (!invoice.quotation_id && !invoice.contract_id) return empty
  return (
    <div>
      {invoice.quotation_id && (
        <Reference label='Quotation' number={invoice.quotation_number} id={invoice.quotation_id} exists={invoice.quotation_exists} path='quotation' />
      )}
      {invoice.contract_id && (
        <Reference label='Contract' number={invoice.contract_number} id={invoice.contract_id} exists={invoice.contract_exists} path='contract' />
      )}
    </div>
  )
}

export default SourceReference
