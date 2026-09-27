import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, Badge } from 'reactstrap'
import { selectThemeColors, sortOptions } from '@utils'
import DateField from '../../shared/DateField'
import AmountField from '../../shared/AmountField'
import VendorBillAttachments from './VendorBillAttachments'
import { addVendorBill, updateVendorBill, getVendorBill } from '../store'
import HistoryModal from '../../activity-log/HistoryModal'

const defaultValues = {
  bill_number: '',
  amount: '',
  bill_date: '',
  due_date: '',
  notes: ''
}

const VendorBillForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.vendorBills)

  const [vendorOptions, setVendorOptions] = useState([])
  const [projectOptions, setProjectOptions] = useState([])
  const [currencyOptions, setCurrencyOptions] = useState([])

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
  const projectId = watch('project_id')
  const currency = watch('currency')
  const status = store.selectedVendorBill?.status

  useEffect(() => {
    axios.get('/vendors', { params: { perPage: 100, is_active: '1' } }).then(response => {
      setVendorOptions(sortOptions(response.data.data.vendors.map(v => ({ value: v.id, label: v.name }))))
    })
    axios.get('/projects', { params: { perPage: 100 } }).then(response => {
      setProjectOptions(sortOptions(response.data.data.projects.map(p => ({ value: p.id, label: p.name }))))
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
    if (isEdit) dispatch(getVendorBill(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedVendorBill && store.selectedVendorBill.id === Number(id)) {
      const bill = store.selectedVendorBill
      reset({
        bill_number: bill.bill_number || '',
        amount: bill.amount ?? '',
        bill_date: bill.bill_date || '',
        due_date: bill.due_date || '',
        notes: bill.notes || ''
      })
      setValue('vendor_id', bill.vendor_id || '')
      setValue('project_id', bill.project_id || '')
      setValue('currency', bill.currency || 'USD')
    }
  }, [store.selectedVendorBill])

  const checkIsValid = data => vendorId && data.amount !== '' && Number(data.amount) > 0 && data.bill_date && data.due_date

  const onSubmit = data => {
    if (checkIsValid(data)) {
      const payload = {
        vendor_id: vendorId,
        project_id: projectId || null,
        bill_number: data.bill_number || null,
        amount: Number(data.amount),
        currency: currency || 'USD',
        bill_date: data.bill_date,
        due_date: data.due_date,
        notes: data.notes || null
      }

      const action = isEdit ? updateVendorBill({ id: Number(id), ...payload }) : addVendorBill(payload)
      dispatch(action).then(() => {
        toast.success(isEdit ? 'Vendor bill updated' : 'Vendor bill added')
        navigate('/vendor-bill')
      })
    } else {
      if (!vendorId) setError('vendor_id', { type: 'manual' })
      if (data.amount === '' || Number(data.amount) <= 0) setError('amount', { type: 'manual' })
      if (!data.bill_date) setError('bill_date', { type: 'manual' })
      if (!data.due_date) setError('due_date', { type: 'manual' })
    }
  }

  const selectedVendorOption = vendorOptions.find(i => i.value === vendorId) || null
  const selectedProjectOption = projectOptions.find(i => i.value === projectId) || null
  const selectedCurrencyOption = currencyOptions.find(i => i.value === currency) || null

  return (
    <Fragment>
      <Card>
        <CardHeader className='d-flex justify-content-between align-items-center'>
          <CardTitle tag='h4'>{isEdit ? 'Edit Vendor Bill' : 'Add New Vendor Bill'}</CardTitle>
          {status && (
            <Badge color={status === 'paid' ? 'light-success' : 'light-warning'} pill className='text-capitalize'>
              {status}
            </Badge>
          )}
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='vendor_id'>
                  Vendor <span className='text-danger'>*</span>
                </Label>
                <Select
                  inputId='vendor_id'
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={vendorOptions}
                  value={selectedVendorOption}
                  onChange={option => setValue('vendor_id', option ? option.value : '', { shouldDirty: true })}
                  placeholder='Select vendor...'
                  styles={errors.vendor_id ? { control: base => ({ ...base, borderColor: '#ea5455' }) } : undefined}
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='bill_number'>
                  Bill Number
                </Label>
                <Controller
                  name='bill_number'
                  control={control}
                  render={({ field }) => <Input id='bill_number' placeholder='INV-2044' {...field} />}
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
                  options={projectOptions}
                  value={selectedProjectOption}
                  onChange={option => setValue('project_id', option ? option.value : '', { shouldDirty: true })}
                  placeholder='Select project...'
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='bill_date'>
                  Bill Date <span className='text-danger'>*</span>
                </Label>
                <Controller
                  name='bill_date'
                  control={control}
                  render={({ field }) => (
                    <DateField id='bill_date' invalid={errors.bill_date && true} value={field.value} onChange={field.onChange} />
                  )}
                />
              </Col>
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='due_date'>
                  Due Date <span className='text-danger'>*</span>
                </Label>
                <Controller
                  name='due_date'
                  control={control}
                  render={({ field }) => (
                    <DateField id='due_date' invalid={errors.due_date && true} value={field.value} onChange={field.onChange} />
                  )}
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
              <Col md={12} className='mb-1'>
                <Label className='form-label' for='notes'>
                  Notes
                </Label>
                <Controller
                  name='notes'
                  control={control}
                  render={({ field }) => <Input id='notes' type='textarea' rows='3' {...field} />}
                />
              </Col>
              <Col md={12}>
                <hr className='my-1' />
                <h6 className='mb-1'>Attachments</h6>
                {isEdit ? (
                  <VendorBillAttachments billId={Number(id)} />
                ) : (
                  <p className='text-muted small mb-0'>Save the bill first to attach the vendor's document.</p>
                )}
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
      {isEdit && <HistoryModal entityType='vendor_bill' entityId={Number(id)} buttonId='vendor-bill-history-btn' />}
    </Fragment>
  )
}

export default VendorBillForm
