export const frequencyOptions = [
  { value: 'one_time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
]

export const contractStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'signed', label: 'Signed' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' }
]

// Only a contract that's actually in force can have invoices raised under
// it - mirrors InvoiceController::INVOICEABLE_CONTRACT_STATUSES.
export const invoiceableContractStatuses = ['active', 'signed']
