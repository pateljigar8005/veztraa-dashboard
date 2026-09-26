import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import DataTable from 'react-data-table-component'
import { CheckSquare, Clock } from 'react-feather'
import { Card, CardHeader, CardTitle, CardBody, Badge, Button } from 'reactstrap'
import { formatDate } from '@utils'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import TableEmptyState from '@src/views/apps/shared/TableEmptyState'
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

  const pendingRequestColumns = [
    { name: 'User', minWidth: '160px', selector: row => row.user_name },
    {
      name: 'Type',
      minWidth: '140px',
      cell: r => (
        <Badge className='text-capitalize' color={`light-${r.leave_type_color}`} pill>
          {r.leave_type_name}
        </Badge>
      )
    },
    {
      name: 'Dates',
      minWidth: '200px',
      cell: r => (
        <span>
          {displayDate(r.start_date)}{r.start_date !== r.end_date ? ` - ${displayDate(r.end_date)}` : ''}
        </span>
      )
    },
    { name: 'Days', width: '90px', selector: row => row.days },
    { name: 'Reason', minWidth: '180px', cell: r => r.reason || <span className='text-muted'>—</span> },
    {
      name: 'Actions',
      right: true,
      minWidth: '190px',
      cell: r => (
        <Fragment>
          <Button size='sm' color='success' className='me-50' disabled={busyId === r.id} onClick={() => handleApprove(r)}>
            Approve
          </Button>
          <Button size='sm' color='danger' outline disabled={busyId === r.id} onClick={() => handleReject(r)}>
            Reject
          </Button>
        </Fragment>
      )
    }
  ]

  const pendingOvertimeColumns = [
    { name: 'User', minWidth: '160px', selector: row => row.user_name },
    { name: 'Date', minWidth: '140px', cell: e => <span>{displayDate(e.date)}</span> },
    { name: 'Hours', width: '110px', selector: row => row.hours },
    { name: 'Reason', minWidth: '180px', cell: e => e.reason || <span className='text-muted'>—</span> },
    {
      name: 'Actions',
      right: true,
      minWidth: '190px',
      cell: e => (
        <Fragment>
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
        </Fragment>
      )
    }
  ]

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Pending Leave Requests</CardTitle>
        </CardHeader>
        <CardBody>
          <div className='react-dataTable'>
            <DataTable
              noHeader
              responsive
              columns={pendingRequestColumns}
              data={store.pendingRequests}
              noDataComponent={
                <TableEmptyState
                  icon={CheckSquare}
                  noun='pending leave requests'
                  message='Leave requests awaiting your approval will show up here.'
                />
              }
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Pending Overtime</CardTitle>
        </CardHeader>
        <CardBody>
          <div className='react-dataTable'>
            <DataTable
              noHeader
              responsive
              columns={pendingOvertimeColumns}
              data={store.pendingOvertimeEntries}
              noDataComponent={
                <TableEmptyState
                  icon={Clock}
                  noun='pending overtime entries'
                  message='Overtime entries awaiting your approval will show up here.'
                />
              }
            />
          </div>
        </CardBody>
      </Card>
    </Fragment>
  )
}

export default LeaveApprovals
