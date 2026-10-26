import { Fragment, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { sanitizeHtml } from '@veztraa/editor'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, Badge, UncontrolledTooltip } from 'reactstrap'
import { Edit2, Trash2, Eye, EyeOff, X, CheckCircle, RotateCcw } from 'react-feather'
import Avatar from '@components/avatar'
import Skeleton from '@components/skeleton'
import { selectThemeColors, getUserData, resolveAvatarUrl } from '@utils'
import { currentUserCan } from '@src/utility/navPermissions'
import { getCachedThemeColor } from '@src/utility/themeColor'
import { confirmDelete } from '@src/utility/confirmDelete'
import { getIssue, updateIssue, deleteIssue, setMonitoring, addComment } from '../store'
import { StatusBadge, SeverityBadge, PriorityBadge, StatusOptionLabel, formatDateTime, formatDay } from '../IssueBits'
import { fetchUserOptions, fetchProjectOptions, assigneeOptionsFor } from '../pickerOptions'
import { userSelectComponents } from '../userSelectParts'
import {
  statusOptions,
  resolutionOptions,
  reproducibilityLabels,
  resolutionLabels,
  categoryLabels,
  DONE_STATUSES,
  issueNumber
} from '../todoOptions'
import IssueRelationships from './IssueRelationships'
import IssueAttachments from './IssueAttachments'
import IssueNotes from './IssueNotes'
import IssueHistory from './IssueHistory'
import '@styles/react/libs/react-select/_react-select.scss'

// Selects in the action bar are sized to match the small buttons next to them.
const compactSelectStyles = {
  control: base => ({ ...base, minHeight: 32, height: 32 }),
  valueContainer: base => ({ ...base, padding: '0 8px' }),
  input: base => ({ ...base, margin: 0, padding: 0 }),
  indicatorsContainer: base => ({ ...base, height: 30 }),
  dropdownIndicator: base => ({ ...base, padding: '0 6px' }),
  clearIndicator: base => ({ ...base, padding: '0 4px' })
}
const sameIds = (a, b) => a.length === b.length && a.every(id => b.includes(id))

const selectProps = {
  classNamePrefix: 'select',
  className: 'react-select',
  theme: selectThemeColors,
  styles: compactSelectStyles
}

// Label cells of the details grid: a light wash instead of a heavy grey
// block. Text color lives in style.scss (.issue-detail-label) so dark
// mode can flip it.
const labelCellStyle = {
  background: 'rgba(var(--bs-secondary-rgb), 0.06)',
  fontSize: '0.95rem',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '0.7rem 1rem'
}
const valueCellStyle = { padding: '0.7rem 1rem' }

// Label/value cell pairs of Mantis's details grid.
const DetailCell = ({ label, children }) => (
  <>
    <th className='issue-detail-label' style={{ ...labelCellStyle, width: '13%' }}>
      {label}
    </th>
    <td style={{ ...valueCellStyle, width: '20%' }}>{children || <span className='text-muted'>-</span>}</td>
  </>
)

const TextSection = ({ label, children }) => (
  <tr>
    <th className='align-top issue-detail-label' style={labelCellStyle}>
      {label}
    </th>
    <td
      colSpan={5}
      style={{
        ...valueCellStyle,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
    >
      {children}
    </td>
  </tr>
)

// Icon-only action with its name in a tooltip.
// Same tinted square buttons as the Edit/Delete actions on every list page.
const ACTION_TINT = {
  primary: () => getCachedThemeColor() + '1f',
  secondary: () => 'rgba(130, 134, 139, 0.12)',
  danger: () => '#ea54551f'
}

const IconAction = ({ id, label, tint = 'secondary', children, ...props }) => (
  <>
    <Button
      id={id}
      size='sm'
      color={`flat-${tint}`}
      className='btn-icon'
      style={{ borderRadius: '4px', backgroundColor: ACTION_TINT[tint]() }}
      aria-label={label}
      {...props}
    >
      {children}
    </Button>
    <UncontrolledTooltip target={id} placement='top'>
      {label}
    </UncontrolledTooltip>
  </>
)

// Small caption over each group in the action bar.
const ToolbarGroup = ({ label, children }) => (
  <div className='d-flex flex-column' style={{ gap: '0.25rem' }}>
    <small className='text-muted' style={{ fontSize: '0.72rem' }}>
      {label}
    </small>
    <div className='d-flex align-items-center' style={{ gap: '0.35rem' }}>
      {children}
    </div>
  </div>
)

const ViewSkeleton = () => (
  <Card>
    <CardBody>
      <Skeleton width='40%' height={22} className='mb-2' />
      {[0, 1, 2, 3, 4].map(i => (
        <Skeleton key={i} width='100%' height={14} className='mb-1' />
      ))}
    </CardBody>
  </Card>
)

const IssueView = () => {
  const { id } = useParams()
  const issueId = Number(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const issue = useSelector(state => state.todo.selectedIssue)
  const currentUser = getUserData()
  const isAdmin = (currentUser?.role || '').toLowerCase() === 'admin'

  const canEdit = currentUserCan(`/todo/edit/${issueId}`, 'edit')
  const canDelete = currentUserCan('/todo', 'delete')

  const [userOptions, setUserOptions] = useState([])
  const [assignTo, setAssignTo] = useState([])
  const [nextStatus, setNextStatus] = useState(null)
  // Resolving/closing asks for the resolution + an optional note first,
  // like Mantis's status change page.
  const [statusModal, setStatusModal] = useState(null)
  const [resolution, setResolution] = useState('fixed')
  const [fixedIn, setFixedIn] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [monitorUser, setMonitorUser] = useState(null)

  const [projectOptions, setProjectOptions] = useState([])

  useEffect(() => {
    fetchUserOptions().then(setUserOptions)
    fetchProjectOptions().then(setProjectOptions)
  }, [])

  useEffect(() => {
    dispatch(getIssue(issueId))
      .unwrap()
      .catch(() => {
        toast.error('That issue no longer exists or you no longer have access to it')
        navigate('/todo')
      })
  }, [issueId])

  useEffect(() => {
    if (issue?.id === issueId) {
      setAssignTo(issue.assignees.map(a => a.id))
      setNextStatus(issue.status)
    }
  }, [issue])

  if (!issue || issue.id !== issueId) {
    return (
      <Fragment>
        <ViewSkeleton />
      </Fragment>
    )
  }

  const isDone = DONE_STATUSES.includes(issue.status)
  const isMonitoring = issue.monitors.some(m => m.id === currentUser?.id)

  const save = (changes, message) =>
    dispatch(updateIssue({ id: issueId, ...changes }))
      .unwrap()
      .then(() => toast.success(message))
      .catch(err => toast.error(err?.message || 'Failed to update issue'))

  const handleAssign = () => save({ assignee_ids: assignTo }, assignTo.length ? 'Assignees updated' : 'Issue unassigned')

  const openStatusChange = status => {
    if (DONE_STATUSES.includes(status)) {
      setResolution(issue.resolution === 'open' || issue.resolution === 'reopened' ? 'fixed' : issue.resolution)
      setFixedIn(issue.fixed_in_version || '')
      setStatusNote('')
      setStatusModal(status)
    } else {
      save({ status }, 'Status updated')
    }
  }

  const confirmStatusChange = async () => {
    const status = statusModal
    setStatusModal(null)
    await save({ status, resolution, fixed_in_version: fixedIn || null }, 'Status updated')
    if (statusNote.trim()) {
      dispatch(addComment({ taskId: issueId, comment: statusNote.trim() }))
    }
  }

  const handleReopen = () =>
    save(
      {
        status: issue.assignees.length ? 'assigned' : 'feedback',
        resolution: 'reopened'
      },
      'Issue reopened'
    )

  const handleMonitor = (monitor, userId) =>
    dispatch(setMonitoring({ id: issueId, monitor, userId }))
      .unwrap()
      .then(result => {
        // Unmonitoring can remove a non-admin's access to the issue.
        if (!result) navigate('/todo')
      })
      .catch(err => toast.error(err?.message || 'Failed to update monitoring'))

  // Ending monitoring can take away a non-admin's access to the issue.
  const confirmEndMonitor = () =>
    confirmDelete({
      title: 'Stop monitoring this issue?',
      text: "You won't get updates about it anymore.",
      confirmButtonText: 'Yes, stop monitoring',
      onConfirm: () => handleMonitor(false)
    })

  const handleDelete = () =>
    confirmDelete({
      title: `Delete issue ${issueNumber(issueId)}?`,
      text: "You won't be able to revert this!",
      onConfirm: () =>
        dispatch(deleteIssue(issueId))
          .unwrap()
          .then(() => {
            toast.success('Issue deleted')
            navigate('/todo')
          })
          .catch(err => toast.error(err?.message || 'Failed to delete'))
    })

  const person = p =>
    p ? (
      <span className='d-inline-flex align-items-center'>
        <Avatar
          initials
          size='sm'
          className='me-50'
          color='light-primary'
          content={p.full_name}
          img={resolveAvatarUrl(p.avatar) || undefined}
        />
        {p.full_name}
      </span>
    ) : null

  return (
    <Fragment>
      <Card>
        <CardBody>
          <div className='d-flex flex-wrap align-items-start justify-content-between mb-1' style={{ gap: '0.75rem' }}>
            <div style={{ minWidth: 0 }}>
              <small className='text-muted fw-bolder d-block mb-25'>#{issueNumber(issue.id)}</small>
              <h3 className='mb-25' style={{ wordBreak: 'break-word' }}>
                {issue.title}
              </h3>
              <small className='text-muted'>
                Reported by {issue.reporter?.full_name || 'Unknown'} · {formatDateTime(issue.created_at)}
              </small>
            </div>
            <StatusBadge status={issue.status} />
          </div>

          {/* Mantis's action bar, grouped: change the issue on the left,
              everything else on the right. */}
          <div
            className='d-flex flex-wrap align-items-end justify-content-between rounded p-1 mb-2'
            style={{
              gap: '0.75rem',
              background: 'rgba(var(--bs-secondary-rgb), 0.06)'
            }}
          >
            <div className='d-flex flex-wrap align-items-end' style={{ gap: '1rem' }}>
              {canEdit && (
                <ToolbarGroup label='Assign to'>
                  <div style={{ minWidth: 220, maxWidth: 420 }}>
                    <Select
                      classNamePrefix='select'
                      className='react-select'
                      theme={selectThemeColors}
                      isMulti
                      components={userSelectComponents}
                      placeholder='Unassigned'
                      options={assigneeOptionsFor(
                        userOptions,
                        projectOptions.find(p => p.value === issue.project_id),
                        issue.assignees.map(a => a.id)
                      )}
                      value={userOptions.filter(o => assignTo.includes(o.value))}
                      onChange={picked => setAssignTo((picked || []).map(o => o.value))}
                    />
                  </div>
                  <Button
                    size='sm'
                    color='primary'
                    outline
                    style={{ height: 32 }}
                    disabled={sameIds(assignTo, issue.assignees.map(a => a.id))}
                    onClick={handleAssign}
                  >
                    Assign
                  </Button>
                </ToolbarGroup>
              )}
              {canEdit && (
                <ToolbarGroup label='Change status to'>
                  <div style={{ width: 170 }}>
                    <Select
                      {...selectProps}
                      options={statusOptions}
                      formatOptionLabel={o => <StatusOptionLabel status={o.value} />}
                      value={statusOptions.find(o => o.value === nextStatus) || null}
                      onChange={option => setNextStatus(option.value)}
                    />
                  </div>
                  <Button
                    size='sm'
                    color='primary'
                    outline
                    style={{ height: 32 }}
                    disabled={nextStatus === issue.status}
                    onClick={() => openStatusChange(nextStatus)}
                  >
                    Update
                  </Button>
                </ToolbarGroup>
              )}
            </div>
            <div className='d-flex flex-wrap align-items-center' style={{ gap: '0.75rem' }}>
              {canEdit && (
                <IconAction id='issue-edit-btn' label='Edit issue' tint='primary' tag={Link} to={`/todo/edit/${issue.id}`}>
                  <Edit2 size={16} className='text-primary' />
                </IconAction>
              )}
              <IconAction
                id='issue-monitor-btn'
                label={isMonitoring ? 'End monitoring' : 'Monitor this issue'}
                onClick={() => (isMonitoring ? confirmEndMonitor() : handleMonitor(true))}
              >
                {isMonitoring ? <EyeOff size={16} /> : <Eye size={16} />}
              </IconAction>
              {canEdit && issue.status === 'resolved' && (
                <IconAction id='issue-close-btn' label='Close issue' onClick={() => openStatusChange('closed')}>
                  <CheckCircle size={16} />
                </IconAction>
              )}
              {canEdit && isDone && (
                <IconAction id='issue-reopen-btn' label='Reopen issue' onClick={handleReopen}>
                  <RotateCcw size={16} />
                </IconAction>
              )}
              {canDelete && (
                <IconAction id='issue-delete-btn' label='Delete issue' tint='danger' onClick={handleDelete}>
                  <Trash2 size={16} className='text-danger' />
                </IconAction>
              )}
            </div>
          </div>

          <Table bordered responsive className='mb-0' style={{ borderColor: 'rgba(var(--bs-secondary-rgb), 0.18)' }}>
            <tbody>
              <tr>
                <DetailCell label='ID'>{issueNumber(issue.id)}</DetailCell>
                <DetailCell label='Project'>{issue.project_name}</DetailCell>
                <DetailCell label='Category'>{categoryLabels[issue.category] || issue.category}</DetailCell>
              </tr>
              <tr>
                <DetailCell label='Date Submitted'>{formatDateTime(issue.created_at)}</DetailCell>
                <DetailCell label='Last Update'>{formatDateTime(issue.updated_at)}</DetailCell>
                <DetailCell label='Due Date'>{formatDay(issue.due_date)}</DetailCell>
              </tr>
              <tr>
                <DetailCell label='Reporter'>{person(issue.reporter)}</DetailCell>
                <DetailCell label='Assigned To'>
                  {issue.assignees.length > 0 && (
                    <div className='d-flex flex-column' style={{ gap: '0.35rem' }}>
                      {issue.assignees.map(a => (
                        <div key={a.id}>{person(a)}</div>
                      ))}
                    </div>
                  )}
                </DetailCell>
                <DetailCell label='Reproducibility'>{reproducibilityLabels[issue.reproducibility]}</DetailCell>
              </tr>
              <tr>
                <DetailCell label='Priority'>
                  <PriorityBadge priority={issue.priority} />
                </DetailCell>
                <DetailCell label='Severity'>
                  <SeverityBadge severity={issue.severity} />
                </DetailCell>
                <DetailCell label='Status'>
                  <StatusOptionLabel status={issue.status} />
                </DetailCell>
              </tr>
              <tr>
                <DetailCell label='Resolution'>{resolutionLabels[issue.resolution]}</DetailCell>
                <DetailCell label='Platform'>{issue.platform}</DetailCell>
                <DetailCell label='OS'>{[issue.os, issue.os_build].filter(Boolean).join(' ')}</DetailCell>
              </tr>
              <tr>
                <DetailCell label='Product Version'>{issue.product_version}</DetailCell>
                <DetailCell label='Target Version'>{issue.target_version}</DetailCell>
                <DetailCell label='Fixed in Version'>{issue.fixed_in_version}</DetailCell>
              </tr>
              <TextSection label='Summary'>
                <span className='fw-bolder'>
                  {issueNumber(issue.id)}: {issue.title}
                </span>
              </TextSection>
              <tr>
                <th className='align-top issue-detail-label' style={labelCellStyle}>
                  Description
                </th>
                <td colSpan={5} style={{ ...valueCellStyle, wordBreak: 'break-word' }}>
                  {issue.description ? (
                    <div
                      className='issue-description'
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(issue.description)
                      }}
                    />
                  ) : (
                    <span className='text-muted'>-</span>
                  )}
                </td>
              </tr>
              <TextSection label='Steps To Reproduce'>{issue.steps_to_reproduce || <span className='text-muted'>-</span>}</TextSection>
              <TextSection label='Additional Information'>{issue.additional_info || <span className='text-muted'>-</span>}</TextSection>
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <IssueRelationships issue={issue} canEdit={canEdit} />

      <Card>
        <CardBody>
          <h5 className='mb-1'>Attached Files</h5>
          <IssueAttachments taskId={issue.id} />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h5 className='mb-1'>Users Monitoring This Issue</h5>
          {issue.monitors.length === 0 ? (
            <p className='text-muted'>There are no users monitoring this issue.</p>
          ) : (
            <div className='d-flex flex-wrap mb-1' style={{ gap: '0.5rem' }}>
              {issue.monitors.map(m => (
                <Badge key={m.id} color='light-secondary' className='d-inline-flex align-items-center'>
                  {m.full_name}
                  {(isAdmin || m.id === currentUser?.id) && (
                    <X
                      size={12}
                      className='ms-50 cursor-pointer'
                      onClick={() => handleMonitor(false, m.id === currentUser?.id ? undefined : m.id)}
                    />
                  )}
                </Badge>
              ))}
            </div>
          )}
          {isAdmin && (
            <div className='d-flex align-items-center' style={{ gap: '0.25rem' }}>
              <div className='flex-grow-1'>
                <Select
                  {...selectProps}
                  isClearable
                  placeholder='Add user...'
                  options={userOptions.filter(o => !issue.monitors.some(m => m.id === o.value))}
                  value={monitorUser}
                  onChange={setMonitorUser}
                />
              </div>
              <Button
                size='sm'
                outline
                color='primary'
                disabled={!monitorUser}
                onClick={() => {
                  handleMonitor(true, monitorUser.value)
                  setMonitorUser(null)
                }}
              >
                Add
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <IssueNotes issueId={issue.id} userOptions={userOptions} />
      <IssueHistory issueId={issue.id} />

      <Modal isOpen={Boolean(statusModal)} toggle={() => setStatusModal(null)} className='modal-dialog-centered'>
        <ModalHeader toggle={() => setStatusModal(null)}>
          {statusModal === 'closed' ? 'Close Issue' : 'Resolve Issue'} {issueNumber(issue.id)}
        </ModalHeader>
        <ModalBody>
          <div className='mb-1'>
            <Label className='form-label'>Resolution</Label>
            <Select
              {...selectProps}
              options={resolutionOptions.filter(o => o.value !== 'open' && o.value !== 'reopened')}
              value={resolutionOptions.find(o => o.value === resolution)}
              onChange={option => setResolution(option.value)}
            />
          </div>
          <div className='mb-1'>
            <Label className='form-label' for='fixed-in-version'>
              Fixed in Version
            </Label>
            <Input id='fixed-in-version' value={fixedIn} onChange={e => setFixedIn(e.target.value)} />
          </div>
          <div>
            <Label className='form-label' for='status-note'>
              Add Note
            </Label>
            <Input id='status-note' type='textarea' rows='3' value={statusNote} onChange={e => setStatusNote(e.target.value)} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color='flat-secondary' onClick={() => setStatusModal(null)}>
            Cancel
          </Button>
          <Button color='primary' onClick={confirmStatusChange}>
            {statusModal === 'closed' ? 'Close Issue' : 'Resolve Issue'}
          </Button>
        </ModalFooter>
      </Modal>
    </Fragment>
  )
}

export default IssueView
