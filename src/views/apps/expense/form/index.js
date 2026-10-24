import { Fragment, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { selectThemeColors, sortOptions, clientOptionLabel } from '@utils'
import DateField from '../../shared/DateField'
import AmountField from '../../shared/AmountField'
import ExpenseAttachments from './ExpenseAttachments'
import { expenseCategoryOptions } from '../expenseCategoryOptions'
import { addExpense, updateExpense, getExpense } from '../store'
import HistoryModal from '../../activity-log/HistoryModal'

const defaultValues = {
  description: '',
  amount: '',
  expense_date: '',
  recurrence_count: '',
  recurrence_end_date: ''
}

const typeOptions = [
  { value: 'one_time', label: 'One-time' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'emi', label: 'EMI' }
]

const recurrenceOptions = [
  { value: 'none', label: "Doesn't repeat" },
  { value: 'monthly', label: 'Every month' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'yearly', label: 'Every year' }
]

const endOptions = [
  { value: 'never', label: 'Never' },
  { value: 'count', label: 'After a number of times' },
  { value: 'date', label: 'On a date' },
  { value: 'stop', label: 'Stop now - no more payments' }
]

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ExpenseForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.expenses)

  const [vendorOptions, setVendorOptions] = useState([])
  const [clientOptions, setClientOptions] = useState([])
  const [projectOptions, setProjectOptions] = useState([])
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([])
  const [currencyOptions, setCurrencyOptions] = useState([])
  const [expenseType, setExpenseType] = useState('one_time')
  const [recurrence, setRecurrence] = useState('none')
  const [endMode, setEndMode] = useState('never')

  const {
    control,
    reset,
    setValue,
    setError,
    handleSubmit,
    watch,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty)

  const vendorId = watch('vendor_id')
  const clientId = watch('client_id')
  const projectId = watch('project_id')
  const paymentMethodId = watch('payment_method_id')
  const category = watch('category')
  const currency = watch('currency')

  useEffect(() => {
    axios.get('/vendors', { params: { perPage: 100, is_active: '1' } }).then(response => {
      setVendorOptions(sortOptions(response.data.data.vendors.map(v => ({ value: v.id, label: v.name }))))
    })
    axios.get('/clients', { params: { perPage: 100 } }).then(response => {
      const clients = response.data.data.clients
      setClientOptions(sortOptions(clients.map(c => ({ value: c.id, label: clientOptionLabel(c) }))))
    })
    axios.get('/projects', { params: { perPage: 100 } }).then(response => {
      setProjectOptions(sortOptions(response.data.data.projects.map(p => ({ value: p.id, label: p.name, clientId: p.client_id }))))
    })
    axios.get('/payment-methods', { params: { perPage: 100 } }).then(response => {
      setPaymentMethodOptions(response.data.data.paymentMethods.map(m => ({ value: m.id, label: m.name })))
    })
    axios.get('/currencies', { params: { perPage: 100 } }).then(response => {
      setCurrencyOptions(
        sortOptions(response.data.data.currencies.filter(c => c.is_active).map(c => ({ value: c.icon, label: `${c.name} (${c.icon})` })))
      )
    })
    if (!isEdit) {
      axios.get('/company').then(response => {
        if (response.data.data.currency_icon) setValue('currency', response.data.data.currency_icon)
      })
    }
  }, [])

  useEffect(() => {
    if (isEdit) dispatch(getExpense(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedExpense && store.selectedExpense.id === Number(id)) {
      const expense = store.selectedExpense
      reset({
        description: expense.description || '',
        amount: expense.amount ?? '',
        expense_date: expense.expense_date || '',
        recurrence_count: expense.recurrence_count ?? '',
        recurrence_end_date: expense.recurrence_end_date || ''
      })
      setExpenseType(expense.expense_type || 'one_time')
      setRecurrence(expense.recurrence || 'none')
      setEndMode(expense.recurrence_count ? 'count' : expense.recurrence_end_date ? 'date' : 'never')
      setValue('vendor_id', expense.vendor_id || '')
      setValue('client_id', expense.client_id || '')
      setValue('project_id', expense.project_id || '')
      setValue('payment_method_id', expense.payment_method_id || '')
      setValue('category', expense.category || '')
      setValue('currency', expense.currency || 'USD')
    }
  }, [store.selectedExpense])

  const isGeneratedCopy = isEdit && store.selectedExpense?.id === Number(id) && store.selectedExpense?.recurring_parent_id
  const repeats = recurrence !== 'none'

  const recurrenceValid = data =>
    !repeats ||
    endMode === 'never' ||
    (endMode === 'count' && Number(data.recurrence_count) >= 2) ||
    (endMode === 'date' && data.recurrence_end_date && data.recurrence_end_date > data.expense_date) ||
    endMode === 'stop'

  const checkIsValid = data =>
    data.amount !== '' && Number(data.amount) > 0 && data.expense_date && category && recurrenceValid(data)

  const onSubmit = data => {
    if (checkIsValid(data)) {
      const payload = {
        vendor_id: vendorId || null,
        client_id: clientId || null,
        project_id: projectId || null,
        payment_method_id: paymentMethodId || null,
        category,
        description: data.description || null,
        amount: Number(data.amount),
        currency: currency || 'USD',
        expense_date: data.expense_date,
        expense_type: expenseType
      }
      if (!isGeneratedCopy) {
        payload.recurrence = recurrence
        payload.recurrence_count = repeats && endMode === 'count' ? Number(data.recurrence_count) : null
        // "Stop now" keeps the series (so its past payments stay grouped
        // under this expense) and just ends it today - no new copies after.
        payload.recurrence_end_date = repeats && endMode === 'date' ? data.recurrence_end_date : repeats && endMode === 'stop' ? todayIso() : null
      }

      const action = isEdit ? updateExpense({ id: Number(id), ...payload }) : addExpense(payload)
      dispatch(action).then(() => {
        toast.success(isEdit ? 'Expense updated' : 'Expense added')
        navigate('/expense')
      })
    } else {
      if (!category) setError('category', { type: 'manual' })
      if (data.amount === '' || Number(data.amount) <= 0) setError('amount', { type: 'manual' })
      if (!data.expense_date) setError('expense_date', { type: 'manual' })
      if (repeats && endMode === 'count' && Number(data.recurrence_count) < 2) setError('recurrence_count', { type: 'manual' })
      if (repeats && endMode === 'date' && !(data.recurrence_end_date > data.expense_date)) {
        setError('recurrence_end_date', { type: 'manual' })
      }
    }
  }

  const selectedVendorOption = vendorOptions.find(i => i.value === vendorId) || null
  const selectedClientOption = clientOptions.find(i => i.value === clientId) || null
  const selectedProjectOption = projectOptions.find(i => i.value === projectId) || null
  // With a client picked, only that client's projects are offered; with no
  // client, every project is (picking one then fills in its client).
  const visibleProjectOptions = clientId ? projectOptions.filter(p => p.clientId === clientId) : projectOptions
  const selectedPaymentMethodOption = paymentMethodOptions.find(i => i.value === paymentMethodId) || null
  const selectedCurrencyOption = currencyOptions.find(i => i.value === currency) || null
  const selectedCategoryOption = category ? { value: category, label: category } : null

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>{isEdit ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='category'>
                  Category <span className='text-danger'>*</span>
                </Label>
                <CreatableSelect
                  inputId='category'
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={expenseCategoryOptions}
                  value={selectedCategoryOption}
                  onChange={option => setValue('category', option ? option.value : '', { shouldDirty: true })}
                  placeholder='Select or type a category...'
                  styles={errors.category ? { control: base => ({ ...base, borderColor: '#ea5455' }) } : undefined}
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='expense_date'>
                  Date <span className='text-danger'>*</span>
                </Label>
                <Controller
                  name='expense_date'
                  control={control}
                  render={({ field }) => (
                    <DateField id='expense_date' invalid={errors.expense_date && true} value={field.value} onChange={field.onChange} />
                  )}
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='vendor_id'>
                  Vendor
                </Label>
                <Select
                  inputId='vendor_id'
                  isClearable
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={vendorOptions}
                  value={selectedVendorOption}
                  onChange={option => setValue('vendor_id', option ? option.value : '', { shouldDirty: true })}
                  placeholder='Select vendor...'
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='client_id'>
                  Client
                </Label>
                <Select
                  inputId='client_id'
                  isClearable
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={clientOptions}
                  value={selectedClientOption}
                  onChange={option => {
                    const nextClientId = option ? option.value : ''
                    setValue('client_id', nextClientId, { shouldDirty: true })
                    const currentProject = projectOptions.find(p => p.value === projectId)
                    if (currentProject && nextClientId && currentProject.clientId !== nextClientId) {
                      setValue('project_id', '', { shouldDirty: true })
                    }
                  }}
                  placeholder='Select client...'
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='project_id'>
                  Project
                </Label>
                <Select
                  inputId='project_id'
                  isClearable
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={visibleProjectOptions}
                  value={selectedProjectOption}
                  onChange={option => {
                    setValue('project_id', option ? option.value : '', { shouldDirty: true })
                    if (option?.clientId && !clientId) setValue('client_id', option.clientId, { shouldDirty: true })
                  }}
                  placeholder='Select project...'
                  noOptionsMessage={() => (clientId ? 'No projects for this client' : 'No projects')}
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='payment_method_id'>
                  Payment Method
                </Label>
                <Select
                  inputId='payment_method_id'
                  isClearable
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={paymentMethodOptions}
                  value={selectedPaymentMethodOption}
                  onChange={option => setValue('payment_method_id', option ? option.value : '', { shouldDirty: true })}
                  placeholder='Select payment method...'
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='currency'>
                  Currency
                </Label>
                <Select
                  inputId='currency'
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={currencyOptions}
                  value={selectedCurrencyOption}
                  onChange={option => setValue('currency', option ? option.value : 'USD', { shouldDirty: true })}
                  placeholder='Select currency...'
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='amount'>
                  Amount <span className='text-danger'>*</span>
                </Label>
                <Controller
                  name='amount'
                  control={control}
                  render={({ field }) => (
                    <AmountField id='amount' placeholder='0.00' invalid={errors.amount && true} value={field.value} onChange={field.onChange} />
                  )}
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='expense_type'>
                  Type
                </Label>
                <Select
                  inputId='expense_type'
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={typeOptions}
                  value={typeOptions.find(o => o.value === expenseType)}
                  onChange={option => setExpenseType(option ? option.value : 'one_time')}
                />
              </Col>
              {isGeneratedCopy ? (
                <Col md={8} className='mb-1 d-flex align-items-end'>
                  <p className='text-muted small mb-50'>
                    Auto-generated from a recurring expense.{' '}
                    <Link to={`/expense/edit/${store.selectedExpense.recurring_parent_id}`}>
                      Edit the repeat settings on the original
                    </Link>
                    . Changes here only affect this one.
                  </p>
                </Col>
              ) : (
                <Fragment>
                  <Col md={4} className='mb-1'>
                    <Label className='form-label' for='recurrence'>
                      Repeat
                    </Label>
                    <Select
                      inputId='recurrence'
                      classNamePrefix='select'
                      className='react-select'
                      theme={selectThemeColors}
                      options={recurrenceOptions}
                      value={recurrenceOptions.find(o => o.value === recurrence)}
                      onChange={option => setRecurrence(option ? option.value : 'none')}
                    />
                  </Col>
                  {isEdit && !repeats && store.selectedExpense?.id === Number(id) && store.selectedExpense?.recurrence !== 'none' && (
                    <Col md={4} className='mb-1 d-flex align-items-end'>
                      <p className='text-warning small mb-50'>
                        Turning repeat off removes this series' grouping. To just stop future payments, keep the repeat and
                        choose Ends: "Stop now".
                      </p>
                    </Col>
                  )}
                  {repeats && (
                    <Col md={4} className='mb-1'>
                      <Label className='form-label' for='recurrence_end'>
                        Ends
                      </Label>
                      <div className='d-flex' style={{ gap: '0.5rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Select
                            inputId='recurrence_end'
                            classNamePrefix='select'
                            className='react-select'
                            theme={selectThemeColors}
                            options={endOptions}
                            value={endOptions.find(o => o.value === endMode)}
                            onChange={option => setEndMode(option ? option.value : 'never')}
                          />
                        </div>
                        {endMode === 'count' && (
                          <Controller
                            name='recurrence_count'
                            control={control}
                            render={({ field }) => (
                              <Input
                                type='number'
                                min='2'
                                step='1'
                                placeholder='Times'
                                style={{ width: '90px' }}
                                invalid={errors.recurrence_count && true}
                                {...field}
                              />
                            )}
                          />
                        )}
                        {endMode === 'date' && (
                          <div style={{ width: '150px' }}>
                            <Controller
                              name='recurrence_end_date'
                              control={control}
                              render={({ field }) => (
                                <DateField invalid={errors.recurrence_end_date && true} value={field.value} onChange={field.onChange} />
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </Col>
                  )}
                </Fragment>
              )}
              <Col md={12} className='mb-1'>
                <Label className='form-label' for='description'>
                  Description
                </Label>
                <Controller
                  name='description'
                  control={control}
                  render={({ field }) => <Input id='description' type='textarea' rows='3' {...field} />}
                />
              </Col>
              <Col md={12}>
                <hr className='my-1' />
                <h6 className='mb-1'>Receipts</h6>
                {isEdit ? (
                  <ExpenseAttachments expenseId={Number(id)} />
                ) : (
                  <p className='text-muted small mb-0'>Save the expense first to attach receipts.</p>
                )}
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
      {isEdit && <HistoryModal entityType='expense' entityId={Number(id)} buttonId='expense-history-btn' />}
    </Fragment>
  )
}

export default ExpenseForm
