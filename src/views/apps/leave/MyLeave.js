import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Clock, Briefcase } from 'react-feather'
import DataTable from 'react-data-table-component'
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Row,
  Col,
  Button,
  Badge
} from 'reactstrap'
import { formatDate } from '@utils'
import { confirmDelete } from '@src/utility/confirmDelete'
import '@styles/react/libs/tables/react-dataTable-component.scss'
import TableEmptyState from '@src/views/apps/shared/TableEmptyState'
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

  const leaveRequestColumns = [
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
      minWidth: '220px',
      cell: r => (
        <span>
          {displayDate(r.start_date)}{r.start_date !== r.end_date ? ` - ${displayDate(r.end_date)}` : ''}
          {r.half_day !== 'none' && <small className='text-muted d-block'>{r.half_day.replace('_', ' ')}</small>}
        </span>
      )
    },
    { name: 'Days', width: '90px', selector: row => row.days },
    {
      name: 'Status',
      width: '130px',
      cell: r => (
        <Badge color={statusColor[r.status]} className='text-capitalize'>
          {r.status}
        </Badge>
      )
    },
    {
      name: 'Reason / Rejection',
      minWidth: '200px',
      cell: r =>
        r.status === 'rejected' && r.rejection_reason ? (
          <span className='text-danger'>{r.rejection_reason}</span>
        ) : (
          r.reason || <span className='text-muted'>—</span>
        )
    },
    {
      name: 'Actions',
      right: true,
      minWidth: '160px',
      cell: r => (
        <Fragment>
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
        </Fragment>
      )
    }
  ]

  const overtimeColumns = [
    { name: 'Date', minWidth: '140px', cell: e => <span>{displayDate(e.date)}</span> },
    { name: 'Hours', width: '110px', selector: row => row.hours },
    {
      name: 'Status',
      width: '130px',
      cell: e => (
        <Badge color={statusColor[e.status]} className='text-capitalize'>
          {e.status}
        </Badge>
      )
    },
    { name: 'Reason', minWidth: '200px', cell: e => e.reason || <span className='text-muted'>—</span> }
  ]

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>My Leave Balance ({store.balancesYear})</CardTitle>
          <Button color='primary' size='sm' onClick={() => setOtOpen(true)}>
            <Clock size={14} className='me-50' /> Log Overtime
          </Button>
          {/* No visible trigger - the navbar's Add icon clicks this
              (NavbarBookmarks.js's listToAddButtonId), since applying for
              leave is a modal here rather than an /my-leave/add page. */}
          <Button id='my-leave-apply-btn' className='d-none' onClick={() => { setEditingRequest(null); setApplyOpen(true) }}>
            Apply for Leave
          </Button>
        </CardHeader>
        <CardBody>
          <Row className='g-2'>
            {store.balances.map(b => (
              <Col md={3} sm={6} key={b.leave_type_id}>
                <Card className='mb-0 h-100 border'>
                  <CardBody className='d-flex align-items-center'>
                    <div className={`avatar avatar-stats p-50 m-0 me-2 bg-light-${b.color}`}>
                      <div className='avatar-content'>
                        <Briefcase size={22} />
                      </div>
                    </div>
                    <div>
                      <h3 className='fw-bolder mb-0'>{b.remaining}</h3>
                      <p className='card-text text-muted mb-0'>{b.leave_type_name}</p>
                      <small className='text-muted'>
                        Accrued {b.accrued} + Opening {b.opening_balance} + Adjusted {b.adjusted} - Used {b.used}
                      </small>
                    </div>
                  </CardBody>
                </Card>
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
          <div className='react-dataTable'>
            <DataTable
              noHeader
              responsive
              columns={leaveRequestColumns}
              data={store.myRequests}
              noDataComponent={
                <TableEmptyState
                  icon={Briefcase}
                  noun='leave requests'
                  message="Apply for leave from the navbar and it'll show up here."
                />
              }
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>My Overtime Entries</CardTitle>
        </CardHeader>
        <CardBody>
          <div className='react-dataTable'>
            <DataTable
              noHeader
              responsive
              columns={overtimeColumns}
              data={store.myOvertimeEntries}
              noDataComponent={
                <TableEmptyState icon={Clock} noun='overtime entries' message="Log overtime and it'll show up here." />
              }
            />
          </div>
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
