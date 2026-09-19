import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Label, Input, FormFeedback } from 'reactstrap'
import { selectThemeColors, formatAmount } from '@utils'
import DateField from '../shared/DateField'
import AmountField from '../shared/AmountField'

const defaultValues = {
  amount: '',
  rate_to_inr: '',
  payment_date: new Date().toISOString().slice(0, 10),
  notes: ''
}

const RecordPaymentModal = ({ isOpen, toggle, invoiceId, currency, balanceDue, payment, onSaved }) => {
  const isEdit = Boolean(payment)
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([])
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    control,
    reset,
    setValue,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({ defaultValues })

  useEffect(() => {
    if (isOpen) {
      axios.get('/payment-methods', { params: { perPage: 100 } }).then(response => {
        setPaymentMethodOptions(
          response.data.data.paymentMethods.filter(m => m.is_active).map(m => ({ value: m.id, label: m.name }))
        )
      })

      if (isEdit) {
        reset({
          amount: payment.amount,
          rate_to_inr: payment.rate_to_inr ?? '',
          payment_date: payment.payment_date,
          notes: payment.notes || ''
        })
        setPaymentMethodId(payment.payment_method_id || '')
        return
      }

      reset(defaultValues)
      setPaymentMethodId('')
      axios.get('/currencies', { params: { perPage: 100 } }).then(response => {
        const match = response.data.data.currencies.find(c => c.icon === currency)
        if (match) setValue('rate_to_inr', Number(match.rate).toFixed(2))
      })
    }
  }, [isOpen])

  const onSubmit = data => {
    if (!data.amount || Number(data.amount) <= 0) {
      setError('amount', { type: 'manual' })
      return
    }
    if (typeof balanceDue === 'number' && Number(data.amount) > balanceDue + 0.01) {
      setError('amount', { type: 'manual', message: `Amount exceeds the balance due (${currency} ${formatAmount(balanceDue)})` })
      toast.error(`Amount exceeds the balance due (${currency} ${formatAmount(balanceDue)})`)
      return
    }
    if (!data.payment_date) {
      setError('payment_date', { type: 'manual' })
      return
    }

    const payload = {
      amount: Number(data.amount),
      rate_to_inr: data.rate_to_inr === '' ? null : Number(data.rate_to_inr),
      payment_date: data.payment_date,
      payment_method_id: paymentMethodId || null,
      notes: data.notes || null
    }

    setSubmitting(true)
    const request = isEdit
      ? axios.put(`/invoice-payments/${payment.id}`, payload)
      : axios.post(`/invoices/${invoiceId}/payments`, payload)

    request
      .then(() => {
        toast.success(isEdit ? 'Payment updated' : 'Payment recorded')
        setSubmitting(false)
        toggle()
        onSaved()
      })
      .catch(err => {
        setSubmitting(false)
        const message = err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'record'} payment`
        setError('amount', { type: 'manual', message })
        toast.error(message)
      })
  }

  const selectedPaymentMethodOption = paymentMethodOptions.find(i => i.value === paymentMethodId) || null

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>{isEdit ? 'Edit Payment' : 'Record Payment'}</ModalHeader>
      <ModalBody>
        <Row>
          <Col md={6} className='mb-1'>
            <Label className='form-label' for='payment-amount'>
              Amount ({currency || '$'}) <span className='text-danger'>*</span>
            </Label>
            <Controller
              name='amount'
              control={control}
              render={({ field }) => (
                <AmountField
                  id='payment-amount'
                  placeholder='0.00'
                  invalid={errors.amount && true}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.amount?.message && <FormFeedback>{errors.amount.message}</FormFeedback>}
            {typeof balanceDue === 'number' && (
              <p className='text-muted small mb-0 mt-25'>
                Balance due: {currency} {formatAmount(balanceDue)}
              </p>
            )}
          </Col>
          <Col md={6} className='mb-1'>
            <Label className='form-label' for='payment-date'>
              Payment Date <span className='text-danger'>*</span>
            </Label>
            <Controller
              name='payment_date'
              control={control}
              render={({ field }) => (
                <DateField
                  id='payment-date'
                  value={field.value}
                  onChange={field.onChange}
                  invalid={errors.payment_date && true}
                />
              )}
            />
          </Col>
          <Col md={6} className='mb-1'>
            <Label className='form-label' for='payment-rate'>
              Rate to INR ({`1 ${currency || 'USD'} = ? ₹`})
            </Label>
            <Controller
              name='rate_to_inr'
              control={control}
              render={({ field }) => <Input id='payment-rate' type='number' step='0.01' placeholder='e.g. 84.50' {...field} />}
            />
            <p className='text-muted small mb-0 mt-25'>The real conversion rate on the day this payment was received.</p>
          </Col>
          <Col md={6} className='mb-1'>
            <Label className='form-label'>Payment Method</Label>
            <Select
              isClearable
              className='react-select'
              classNamePrefix='select'
              theme={selectThemeColors}
              options={paymentMethodOptions}
              value={selectedPaymentMethodOption}
              onChange={option => setPaymentMethodId(option ? option.value : '')}
              placeholder='— None —'
            />
          </Col>
          <Col md={12}>
            <Label className='form-label' for='payment-notes'>
              Notes
            </Label>
            <Controller
              name='notes'
              control={control}
              render={({ field }) => <Input id='payment-notes' type='textarea' rows='2' placeholder='Reference / transaction ID, etc.' {...field} />}
            />
          </Col>
        </Row>
      </ModalBody>
      <ModalFooter>
        <Button color='primary' disabled={submitting} onClick={handleSubmit(onSubmit)}>
          {isEdit ? 'Update Payment' : 'Record Payment'}
        </Button>
        <Button color='secondary' outline onClick={toggle}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default RecordPaymentModal