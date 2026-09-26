import { useEffect, useState } from 'react'
import axios from 'axios'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Label, Input } from 'reactstrap'
import DateField from '../shared/DateField'
import { addLeaveRequest, updateLeaveRequest } from './store'

const defaultValues = { leave_type_id: '', start_date: '', end_date: '', half_day: 'none', reason: '' }

const ApplyLeaveModal = ({ isOpen, toggle, leaveRequest, onSaved }) => {
  const dispatch = useDispatch()
  const isEdit = Boolean(leaveRequest)
  const [leaveTypes, setLeaveTypes] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const {
    control,
    reset,
    setError,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({ defaultValues })

  const startDate = watch('start_date')
  const endDate = watch('end_date')

  useEffect(() => {
    if (isOpen) {
      axios.get('/leave-types/active').then(response => setLeaveTypes(response.data.data.leave_types))

      if (isEdit) {
        reset({
          leave_type_id: leaveRequest.leave_type_id,
          start_date: leaveRequest.start_date,
          end_date: leaveRequest.end_date,
          half_day: leaveRequest.half_day,
          reason: leaveRequest.reason || ''
        })
      } else {
        reset(defaultValues)
      }
    }
  }, [isOpen])

  const onSubmit = data => {
    if (!data.leave_type_id || !data.start_date || !data.end_date) {
      if (!data.leave_type_id) setError('leave_type_id', { type: 'manual' })
      if (!data.start_date) setError('start_date', { type: 'manual' })
      if (!data.end_date) setError('end_date', { type: 'manual' })
      return
    }

    const payload = {
      leave_type_id: Number(data.leave_type_id),
      start_date: data.start_date,
      end_date: data.end_date,
      half_day: data.half_day,
      reason: data.reason || null
    }

    setSubmitting(true)
    const action = isEdit ? updateLeaveRequest({ id: leaveRequest.id, ...payload }) : addLeaveRequest(payload)
    dispatch(action)
      .unwrap()
      .then(() => {
        setSubmitting(false)
        toggle()
        onSaved()
      })
      .catch(err => {
        setSubmitting(false)
        const errs = err?.errors || {}
        const message =
          errs.start_date?.[0] || errs.leave_type_id?.[0] || errs.end_date?.[0] || err?.message || 'Failed to submit leave request'
        if (errs.start_date) setError('start_date', { type: 'manual', message: errs.start_date[0] })
        if (errs.leave_type_id) setError('leave_type_id', { type: 'manual', message: errs.leave_type_id[0] })
        setError('reason', { type: 'manual', message: errs.start_date ? undefined : message })
      })
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>{isEdit ? 'Edit Leave Request' : 'Apply for Leave'}</ModalHeader>
      <ModalBody>
        <Row>
          <Col md={12} className='mb-1'>
            <Label className='form-label' for='leave_type_id'>
              Leave Type <span className='text-danger'>*</span>
            </Label>
            <Controller
              name='leave_type_id'
              control={control}
              render={({ field }) => (
                <Input type='select' id='leave_type_id' invalid={errors.leave_type_id && true} {...field}>
                  <option value=''>Select leave type</option>
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Input>
              )}
            />
          </Col>
          <Col md={6} className='mb-1'>
            <Label className='form-label' for='start_date'>
              Start Date <span className='text-danger'>*</span>
            </Label>
            <Controller
              name='start_date'
              control={control}
              render={({ field }) => (
                <DateField id='start_date' value={field.value} onChange={field.onChange} invalid={errors.start_date && true} />
              )}
            />
          </Col>
          <Col md={6} className='mb-1'>
            <Label className='form-label' for='end_date'>
              End Date <span className='text-danger'>*</span>
            </Label>
            <Controller
              name='end_date'
              control={control}
              render={({ field }) => (
                <DateField id='end_date' value={field.value} onChange={field.onChange} invalid={errors.end_date && true} />
              )}
            />
          </Col>
          {startDate && endDate && startDate === endDate && (
            <Col md={12} className='mb-1'>
              <Label className='form-label' for='half_day'>
                Half Day
              </Label>
              <Controller
                name='half_day'
                control={control}
                render={({ field }) => (
                  <Input type='select' id='half_day' {...field}>
                    <option value='none'>Full Day</option>
                    <option value='first_half'>First Half</option>
                    <option value='second_half'>Second Half</option>
                  </Input>
                )}
              />
            </Col>
          )}
          <Col md={12}>
            <Label className='form-label' for='reason'>
              Reason
            </Label>
            <Controller
              name='reason'
              control={control}
              render={({ field }) => <Input id='reason' type='textarea' rows='2' {...field} />}
            />
            {errors.reason?.message && <small className='text-danger d-block mt-25'>{errors.reason.message}</small>}
          </Col>
        </Row>
      </ModalBody>
      <ModalFooter>
        <Button color='primary' disabled={submitting} onClick={handleSubmit(onSubmit)}>
          {isEdit ? 'Update Request' : 'Submit Request'}
        </Button>
        <Button color='secondary' outline onClick={toggle}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ApplyLeaveModal
