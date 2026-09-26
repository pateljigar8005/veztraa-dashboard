import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Label, Input } from 'reactstrap'
import DateField from '../shared/DateField'
import { addOvertimeEntry } from './store'

const defaultValues = { date: '', hours: '', reason: '' }

const LogOvertimeModal = ({ isOpen, toggle, onSaved }) => {
  const dispatch = useDispatch()
  const [submitting, setSubmitting] = useState(false)

  const {
    control,
    reset,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  useEffect(() => {
    if (isOpen) reset(defaultValues)
  }, [isOpen])

  const onSubmit = data => {
    if (!data.date || !data.hours || Number(data.hours) <= 0) {
      if (!data.date) setError('date', { type: 'manual' })
      if (!data.hours || Number(data.hours) <= 0) setError('hours', { type: 'manual' })
      return
    }

    setSubmitting(true)
    dispatch(addOvertimeEntry({ date: data.date, hours: Number(data.hours), reason: data.reason || null }))
      .unwrap()
      .then(() => {
        setSubmitting(false)
        toggle()
        onSaved()
      })
      .catch(err => {
        setSubmitting(false)
        setError('hours', { type: 'manual', message: err?.errors?.hours?.[0] || err?.message || 'Failed to log overtime' })
      })
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Log Overtime</ModalHeader>
      <ModalBody>
        <Row>
          <Col md={6} className='mb-1'>
            <Label className='form-label' for='ot_date'>
              Date <span className='text-danger'>*</span>
            </Label>
            <Controller
              name='date'
              control={control}
              render={({ field }) => <DateField id='ot_date' value={field.value} onChange={field.onChange} invalid={errors.date && true} />}
            />
          </Col>
          <Col md={6} className='mb-1'>
            <Label className='form-label' for='ot_hours'>
              Hours <span className='text-danger'>*</span>
            </Label>
            <Controller
              name='hours'
              control={control}
              render={({ field }) => (
                <Input id='ot_hours' type='number' min='0.5' max='24' step='0.5' invalid={errors.hours && true} {...field} />
              )}
            />
            {errors.hours?.message && <small className='text-danger d-block mt-25'>{errors.hours.message}</small>}
          </Col>
          <Col md={12}>
            <Label className='form-label' for='ot_reason'>
              Reason
            </Label>
            <Controller
              name='reason'
              control={control}
              render={({ field }) => <Input id='ot_reason' type='textarea' rows='2' {...field} />}
            />
          </Col>
        </Row>
        <p className='text-muted small mb-0 mt-1'>
          Once approved, this converts to PL balance based on the company's standard hours/day setting.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button color='primary' disabled={submitting} onClick={handleSubmit(onSubmit)}>
          Submit
        </Button>
        <Button color='secondary' outline onClick={toggle}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default LogOvertimeModal
