import axios from 'axios'

// Common categories offered as a starting point - the field itself is a
// creatable select (see form/index.js), so any custom category typed in
// is stored as-is rather than needing a dedicated settings screen.
export const expenseCategoryOptions = [
  { value: 'Software & Subscriptions', label: 'Software & Subscriptions' },
  { value: 'Office Supplies', label: 'Office Supplies' },
  { value: 'Rent & Utilities', label: 'Rent & Utilities' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Marketing & Advertising', label: 'Marketing & Advertising' },
  { value: 'Professional Services', label: 'Professional Services' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Meals & Entertainment', label: 'Meals & Entertainment' },
  { value: 'Contractor Payments', label: 'Contractor Payments' },
  { value: 'Bank & Payment Fees', label: 'Bank & Payment Fees' },
  { value: 'Taxes & Licenses', label: 'Taxes & Licenses' },
  { value: 'Other', label: 'Other' }
]

// Built-in categories plus every category already used on an expense, so a
// custom one typed in once (e.g. "Home Loan EMI") shows up in every category
// dropdown afterwards - form, list filter and Expense Report alike.
export const fetchExpenseCategoryOptions = () =>
  axios
    .get('/expenses/categories')
    .then(response => response.data.data.categories || [])
    .catch(() => [])
    .then(used => {
      const names = new Set(expenseCategoryOptions.map(o => o.value))
      used.forEach(name => names.add(name))
      return [...names].sort((a, b) => a.localeCompare(b)).map(name => ({ value: name, label: name }))
    })
