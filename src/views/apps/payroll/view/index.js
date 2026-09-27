import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Row, Col, Card, CardHeader, CardTitle, CardBody, Table, Badge, Button } from 'reactstrap'
import { ArrowLeft, CheckCircle, DollarSign } from 'react-feather'
import { getPayrollRun, finalizePayrollRun, markPayslipPaid } from '../store'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import TableEmptyState from '@src/views/apps/shared/TableEmptyState'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const PayrollRunView = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const store = useSelector(state => state.payroll)
  const run = store.selectedRun
  const payslips = store.payslips

  useEffect(() => {
    dispatch(getPayrollRun(id))
  }, [dispatch, id])

  const canManage = currentUserCan('/payroll', 'edit')

  const handleFinalize = () => {
    confirmDelete({
      title: 'Finalize this payroll run?',
      text: 'Numbers will be locked and can no longer be regenerated.',
      confirmButtonText: 'Yes, finalize it',
      onConfirm: () =>
        dispatch(finalizePayrollRun(id))
          .unwrap()
          .then(() => toast.success('Payroll run finalized'))
          .catch(err => toast.error(err?.message || 'Failed to finalize'))
    })
  }

  const handleMarkPaid = payslip => {
    confirmDelete({
      title: `Mark ${payslip.user_name}'s payslip as paid?`,
      text: `Net salary: ${payslip.net_salary.toFixed(2)}`,
      confirmButtonText: 'Yes, mark as paid',
      onConfirm: () =>
        dispatch(markPayslipPaid(payslip.id))
          .unwrap()
          .then(() => toast.success('Payslip marked as paid'))
          .catch(err => toast.error(err?.message || 'Failed to update payslip'))
    })
  }

  if (!run) return null

  return (
    <div className='app-payroll-view'>
      <Row className='mb-1'>
        <Col>
          <Button tag={Link} to='/payroll' color='flat-secondary' size='sm'>
            <ArrowLeft size={14} className='me-50' /> Back to Payroll
          </Button>
        </Col>
      </Row>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>
            {monthNames[run.month - 1]} {run.year}{' '}
            <Badge className='text-capitalize ms-1' color={run.status === 'finalized' ? 'light-success' : 'light-secondary'} pill>
              {run.status}
            </Badge>
          </CardTitle>
          {canManage && run.status === 'draft' && (
            <Button color='primary' size='sm' onClick={handleFinalize}>
              <CheckCircle size={14} className='me-50' /> Finalize
            </Button>
          )}
        </CardHeader>
        <CardBody>
          <Row>
            <Col md='4'><strong>Employees:</strong> {run.employee_count}</Col>
            <Col md='4'><strong>Total Gross:</strong> {run.total_gross.toFixed(2)}</Col>
            <Col md='4'><strong>Total Net:</strong> {run.total_net.toFixed(2)}</Col>
          </Row>
          {run.finalized_by_name && (
            <p className='text-muted small mt-1 mb-0'>Finalized by {run.finalized_by_name} on {run.finalized_at}</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Payslips</CardTitle>
        </CardHeader>
        {payslips.length === 0 ? (
          <CardBody>
            <TableEmptyState
              icon={DollarSign}
              noun='payslips'
              message={
                canManage
                  ? 'No active employee has a salary set. Open a user, mark them as an Employee with a salary, then regenerate this run.'
                  : "You don't have a payslip for this month."
              }
            />
          </CardBody>
        ) : (
          <Table responsive className='mb-0'>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Gross</th>
                <th>Unpaid Leave</th>
                <th>Deduction</th>
                <th>Net</th>
                <th>Status</th>
                {canManage && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {payslips.map(p => (
                <tr key={p.id}>
                  <td>{p.user_name}</td>
                  <td>{p.gross_salary.toFixed(2)}</td>
                  <td>{p.unpaid_leave_days} day(s)</td>
                  <td>{p.unpaid_leave_deduction.toFixed(2)}</td>
                  <td><strong>{p.net_salary.toFixed(2)}</strong></td>
                  <td>
                    <Badge className='text-capitalize' color={p.status === 'paid' ? 'light-success' : 'light-warning'} pill>
                      {p.status}
                    </Badge>
                  </td>
                  {canManage && (
                    <td>
                      {p.status !== 'paid' && (
                        <Button color='flat-primary' size='sm' onClick={() => handleMarkPaid(p)}>
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

export default PayrollRunView
