import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { Card, CardHeader, CardTitle, CardBody, Table, Button } from 'reactstrap'
import { formatDate } from '@utils'
import {
  getPendingLeaveRequests,
  getPendingOvertimeEntries,
  approveLeaveRequest,
  rejectLeaveRequest,
  approveOvertimeEntry,
  rejectOvertimeEntry
} from './store'

const MySwal = withReactContent(Swal)

const displayDate = value => {
  const [y, m, d] = value.split('-').map(Number)
  return formatDate(new Date(y, m - 1, d), { month: 'short', day: 'numeric', year: 'numeric' })
}

const promptRejectionReason = () =>
  MySwal.fire({
    title: 'Reject this leave request?',
    input: 'textarea',
    inputPlaceholder: 'Reason for rejection...',
    showCancelButton: true,
    confirmButtonText: 'Reject',
    cancelButtonText: 'Cancel',
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-outline-secondary ms-1' },
    buttonsStyling: false,
    inputValidator: value => (!value ? 'A reason is required' : undefined)
  })

const LeaveApprovals = () => {
  const dispatch = useDispatch()
  const store = useSelector(state => state.leave)

  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    dispatch(getPendingLeaveRequests())
    dispatch(getPendingOvertimeEntries())
  }, [dispatch])

  const handleApprove = request => {
    setBusyId(request.id)
    dispatch(approveLeaveRequest(request.id))
      .unwrap()
      .then(() => toast.success('Leave request approved'))
      .catch(err => toast.error(err?.message || 'Failed to approve'))
      .finally(() => setBusyId(null))
  }

  const handleReject = request => {
    promptRejectionReason().then(result => {
      if (result.isConfirmed) {
        setBusyId(request.id)
        dispatch(rejectLeaveRequest({ id: request.id, rejection_reason: result.value }))
          .unwrap()
          .then(() => toast.success('Leave request rejected'))
          .catch(err => toast.error(err?.message || 'Failed to reject'))
          .finally(() => setBusyId(null))
      }
    })
  }

  const handleApproveOt = entry => {
    setBusyId(`ot-${entry.id}`)
    dispatch(approveOvertimeEntry(entry.id))
      .unwrap()
      .then(() => toast.success('Overtime approved'))
      .catch(err => toast.error(err?.message || 'Failed to approve'))
      .finally(() => setBusyId(null))
  }

  const handleRejectOt = entry => {
    setBusyId(`ot-${entry.id}`)
    dispatch(rejectOvertimeEntry(entry.id))
      .unwrap()
      .then(() => toast.success('Overtime rejected'))
      .catch(err => toast.error(err?.message || 'Failed to reject'))
      .finally(() => setBusyId(null))
  }

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Pending Leave Requests</CardTitle>
        </CardHeader>
        <CardBody>
          <Table responsive className='mb-0'>
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th className='text-end'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {store.pendingRequests.map(r => (
                <tr key={r.id}>
                  <td>{r.user_name}</td>
                  <td>
                    <span style={{ borderLeft: `3px solid ${r.leave_type_color}`, paddingLeft: '6px' }}>{r.leave_type_name}</span>
                  </td>
                  <td>
                    {displayDate(r.start_date)}{r.start_date !== r.end_date ? ` - ${displayDate(r.end_date)}` : ''}
                  </td>
                  <td>{r.days}</td>
                  <td>{r.reason || <span className='text-muted'>—</span>}</td>
                  <td className='text-end'>
                    <Button
                      size='sm'
                      color='success'
                      className='me-50'
                      disabled={busyId === r.id}
                      onClick={() => handleApprove(r)}
                    >
                      Approve
                    </Button>
                    <Button size='sm' color='danger' outline disabled={busyId === r.id} onClick={() => handleReject(r)}>
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
              {store.pendingRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className='text-center text-muted'>
                    No pending leave requests.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Pending Overtime</CardTitle>
        </CardHeader>
        <CardBody>
          <Table responsive className='mb-0'>
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Hours</th>
                <th>Reason</th>
                <th className='text-end'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {store.pendingOvertimeEntries.map(e => (
                <tr key={e.id}>
                  <td>{e.user_name}</td>
                  <td>{displayDate(e.date)}</td>
                  <td>{e.hours}</td>
                  <td>{e.reason || <span className='text-muted'>—</span>}</td>
                  <td className='text-end'>
                    <Button
                      size='sm'
                      color='success'
                      className='me-50'
                      disabled={busyId === `ot-${e.id}`}
                      onClick={() => handleApproveOt(e)}
                    >
                      Approve
                    </Button>
                    <Button size='sm' color='danger' outline disabled={busyId === `ot-${e.id}`} onClick={() => handleRejectOt(e)}>
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
              {store.pendingOvertimeEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className='text-center text-muted'>
                    No pending overtime entries.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </Fragment>
  )
}

export default LeaveApprovals
