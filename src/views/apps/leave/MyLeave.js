import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Plus, Clock } from 'react-feather'
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Row,
  Col,
  Button,
  Badge,
  Table
} from 'reactstrap'
import { formatDate } from '@utils'
import { confirmDelete } from '@src/utility/confirmDelete'
import ApplyLeaveModal from './ApplyLeaveModal'
import LogOvertimeModal from './LogOvertimeModal'
import { getMyBalances, getMyLeaveRequests, getMyOvertimeEntries, cancelLeaveRequest } from './store'

const statusColor = { pending: 'light-warning', approved: 'light-success', rejected: 'light-danger', cancelled: 'light-secondary' }

const displayDate = value => {
  const [y, m, d] = value.split('-').map(Number)
  return formatDate(new Date(y, m - 1, d), { month: 'short', day: 'numeric', year: 'numeric' })
}

const MyLeave = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.leave)

  const [applyOpen, setApplyOpen] = useState(false)
  const [otOpen, setOtOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState(null)

  const refresh = () => {
    dispatch(getMyBalances())
    dispatch(getMyLeaveRequests())
    dispatch(getMyOvertimeEntries())
  }

  useEffect(() => {
    refresh()
  }, [dispatch])

  const handleCancel = request => {
    confirmDelete({
      title: 'Cancel this leave request?',
      text: `${displayDate(request.start_date)} to ${displayDate(request.end_date)}`,
      confirmButtonText: 'Yes, cancel it',
      onConfirm: () =>
        dispatch(cancelLeaveRequest(request.id))
          .unwrap()
          .then(() => toast.success('Leave request cancelled'))
          .catch(err => toast.error(err?.message || 'Failed to cancel'))
    })
  }

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>My Leave Balance ({store.balancesYear})</CardTitle>
          <div className='d-flex' style={{ gap: '0.5rem' }}>
            <Button color='secondary' outline size='sm' onClick={() => setOtOpen(true)}>
              <Clock size={14} className='me-50' /> Log Overtime
            </Button>
            <Button color='primary' size='sm' onClick={() => { setEditingRequest(null); setApplyOpen(true) }}>
              <Plus size={14} className='me-50' /> Apply for Leave
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <Row>
            {store.balances.map(b => (
              <Col md={4} sm={6} key={b.leave_type_id} className='mb-1'>
                <div className={`p-1 border rounded bg-light-${b.color}`}>
                  <p className='text-muted mb-0'>{b.leave_type_name}</p>
                  <h3 className='mb-0'>{b.remaining}</h3>
                  <small className='text-muted'>
                    Accrued {b.accrued} + Opening {b.opening_balance} + Adjusted {b.adjusted} - Used {b.used}
                  </small>
                </div>
              </Col>
            ))}
            {store.balances.length === 0 && <Col md={12}><p className='text-muted mb-0'>No leave types configured yet.</p></Col>}
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>My Leave Requests</CardTitle>
        </CardHeader>
        <CardBody>
          <Table responsive className='mb-0'>
            <thead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason / Rejection</th>
                <th className='text-end'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {store.myRequests.map(r => (
                <tr key={r.id}>
                  <td>
                    <Badge className='text-capitalize' color={`light-${r.leave_type_color}`} pill>
                      {r.leave_type_name}
                    </Badge>
                  </td>
                  <td>
                    {displayDate(r.start_date)}{r.start_date !== r.end_date ? ` - ${displayDate(r.end_date)}` : ''}
                    {r.half_day !== 'none' && <small className='text-muted d-block'>{r.half_day.replace('_', ' ')}</small>}
                  </td>
                  <td>{r.days}</td>
                  <td>
                    <Badge color={statusColor[r.status]} className='text-capitalize'>
                      {r.status}
                    </Badge>
                  </td>
                  <td>
                    {r.status === 'rejected' && r.rejection_reason ? (
                      <span className='text-danger'>{r.rejection_reason}</span>
                    ) : (
                      r.reason || <span className='text-muted'>—</span>
                    )}
                  </td>
                  <td className='text-end'>
                    {r.status === 'pending' && (
                      <Fragment>
                        <Button
                          size='sm'
                          color='flat-primary'
                          className='me-50'
                          onClick={() => { setEditingRequest(r); setApplyOpen(true) }}
                        >
                          Edit
                        </Button>
                        <Button size='sm' color='flat-danger' onClick={() => handleCancel(r)}>
                          Cancel
                        </Button>
                      </Fragment>
                    )}
                    {r.status === 'approved' && r.start_date > new Date().toISOString().slice(0, 10) && (
                      <Button size='sm' color='flat-danger' onClick={() => handleCancel(r)}>
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {store.myRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className='text-center text-muted'>
                    No leave requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>My Overtime Entries</CardTitle>
        </CardHeader>
        <CardBody>
          <Table responsive className='mb-0'>
            <thead>
              <tr>
                <th>Date</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {store.myOvertimeEntries.map(e => (
                <tr key={e.id}>
                  <td>{displayDate(e.date)}</td>
                  <td>{e.hours}</td>
                  <td>
                    <Badge color={statusColor[e.status]} className='text-capitalize'>
                      {e.status}
                    </Badge>
                  </td>
                  <td>{e.reason || <span className='text-muted'>—</span>}</td>
                </tr>
              ))}
              {store.myOvertimeEntries.length === 0 && (
                <tr>
                  <td colSpan={4} className='text-center text-muted'>
                    No overtime logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <ApplyLeaveModal
        isOpen={applyOpen}
        toggle={() => setApplyOpen(!applyOpen)}
        leaveRequest={editingRequest}
        onSaved={() => toast.success(editingRequest ? 'Leave request updated' : 'Leave request submitted')}
      />
      <LogOvertimeModal isOpen={otOpen} toggle={() => setOtOpen(!otOpen)} onSaved={() => toast.success('Overtime logged')} />
    </Fragment>
  )
}

export default MyLeave
