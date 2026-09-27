import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { selectThemeColors } from '@utils'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Label } from 'reactstrap'
import { generatePayroll } from '../store'

const monthOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
].map((label, i) => ({ value: i + 1, label }))

const currentYear = new Date().getFullYear()
const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map(y => ({ value: y, label: String(y) }))

const GeneratePayrollModal = ({ open, setOpen }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const now = new Date()

  const [month, setMonth] = useState(monthOptions[now.getMonth()])
  const [year, setYear] = useState({ value: now.getFullYear(), label: String(now.getFullYear()) })
  const [submitting, setSubmitting] = useState(false)

  const handleGenerate = () => {
    setSubmitting(true)
    dispatch(generatePayroll({ month: month.value, year: year.value }))
      .unwrap()
      .then(result => {
        toast.success('Payroll generated')
        setOpen(false)
        navigate(`/payroll/view/${result.payroll_run.id}`)
      })
      .catch(err => toast.error(err?.message || 'Failed to generate payroll'))
      .finally(() => setSubmitting(false))
  }

  return (
    <Modal isOpen={open} toggle={() => setOpen(false)} className='modal-dialog-centered'>
      <ModalHeader toggle={() => setOpen(false)}>Generate Payroll</ModalHeader>
      <ModalBody>
        <div className='mb-1'>
          <Label className='form-label' for='payroll-month'>Month</Label>
          <Select
            inputId='payroll-month'
            className='react-select'
            classNamePrefix='select'
            theme={selectThemeColors}
            options={monthOptions}
            value={month}
            onChange={setMonth}
          />
        </div>
        <div>
          <Label className='form-label' for='payroll-year'>Year</Label>
          <Select
            inputId='payroll-year'
            className='react-select'
            classNamePrefix='select'
            theme={selectThemeColors}
            options={yearOptions}
            value={year}
            onChange={setYear}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color='secondary' outline onClick={() => setOpen(false)}>Cancel</Button>
        <Button color='primary' disabled={submitting} onClick={handleGenerate}>
          {submitting ? 'Generating...' : 'Generate'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default GeneratePayrollModal
