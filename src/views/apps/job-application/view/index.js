import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { Trash2, Download } from 'react-feather'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Button, Spinner } from 'reactstrap'
import {
  getJobApplication,
  deleteJobApplication,
  updateJobApplicationStatus,
  getJobApplicationNotes,
  addJobApplicationNote
} from '../store'
import { formatDate, selectThemeColors } from '@utils'
import { confirmDelete } from '@src/utility/confirmDelete'
import { currentUserCan } from '@src/utility/navPermissions'
import HistoryModal from '../../activity-log/HistoryModal'
import NotesSection from '../../shared/NotesSection'

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' }
]

const Field = ({ label, children }) => (
  <Col md='6' className='mb-2'>
    <p className='text-muted mb-0'>{label}</p>
    <p className='mb-0'>{children || '-'}</p>
  </Col>
)

const JobApplicationView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.jobApplications)

  const [downloading, setDownloading] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const canEdit = currentUserCan('/job-application', 'edit')

  useEffect(() => {
    dispatch(getJobApplication(id))
    dispatch(getJobApplicationNotes(id))
  }, [dispatch, id])

  const application = store.selectedJobApplication

  if (!application || application.id !== Number(id)) {
    return null
  }

  const handleStatusChange = option => {
    setStatusSaving(true)
    dispatch(updateJobApplicationStatus({ id: application.id, status: option.value }))
      .unwrap()
      .then(() => toast.success('Status updated'))
      .catch(err => toast.error(err?.message || 'Failed to update status'))
      .finally(() => setStatusSaving(false))
  }

  const handleAddNote = note => {
    setNoteSaving(true)
    return dispatch(addJobApplicationNote({ id: application.id, note }))
      .unwrap()
      .catch(err => toast.error(err?.message || 'Failed to add note'))
      .finally(() => setNoteSaving(false))
  }

  const handleDelete = () => {
    confirmDelete({
      text: `This will permanently delete the application from "${application.full_name}".`,
      onConfirm: () =>
        dispatch(deleteJobApplication(application.id))
          .unwrap()
          .then(() => {
            toast.success('Job application deleted')
            navigate('/job-application')
          })
          .catch(err => toast.error(err?.message || 'Failed to delete'))
    })
  }

  // Same blob-download-then-save pattern as project documents (see
  // ProjectDocuments.js's handleDownload) - the resume lives outside the
  // docroot, so it's fetched through the authenticated API, not linked to
  // directly.
  const handleDownloadResume = async () => {
    setDownloading(true)
    try {
      const response = await axios.get(`/job-applications/${application.id}/resume`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${application.full_name} - Resume`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Failed to download resume')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <Card>
        <CardBody className='d-flex justify-content-between flex-md-row flex-column'>
          <div>
            <h3 className='mb-0'>{application.full_name}</h3>
            <p className='text-muted mb-1'>{application.reference_id}</p>
            <p className='mb-0'>
              {application.email} {application.phone ? `• ${application.phone}` : ''}
            </p>
          </div>
          <div className='d-flex flex-column align-items-md-end mt-md-0 mt-2' style={{ gap: '0.5rem' }}>
            <div className='d-flex align-items-center' style={{ gap: '0.5rem' }}>
              <HistoryModal
                entityType='job_application'
                entityId={application.id}
                entityLabel={application.full_name}
                buttonId='job-application-history-btn'
              />
              {application.has_resume && (
                <Button color='primary' outline onClick={handleDownloadResume} disabled={downloading}>
                  {downloading ? <Spinner size='sm' className='me-50' /> : <Download size={14} className='me-50' />}
                  Download Resume
                </Button>
              )}
              {currentUserCan('/job-application', 'delete') && (
                <Button color='danger' outline onClick={handleDelete}>
                  <Trash2 size={14} className='me-50' /> Delete
                </Button>
              )}
            </div>
            <Select
              inputId='status'
              className='react-select'
              classNamePrefix='select'
              theme={selectThemeColors}
              options={statusOptions}
              value={statusOptions.find(o => o.value === application.status) || statusOptions[0]}
              onChange={handleStatusChange}
              isSearchable={false}
              isDisabled={!canEdit || statusSaving}
              styles={{ container: base => ({ ...base, minWidth: 180 }) }}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Application Details</CardTitle>
        </CardHeader>
        <CardBody>
          <Row>
            <Field label='Full Name'>{application.full_name}</Field>
            <Field label='Email'>{application.email}</Field>
            <Field label='Phone'>{application.phone}</Field>
            <Field label='Area of Expertise'>{application.area_of_expertise}</Field>
            <Field label='Source'>{application.source}</Field>
            <Field label='Submitted'>{formatDate(application.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</Field>
          </Row>
          <Row>
            <Col md='12' className='mb-2'>
              <p className='text-muted mb-0'>Cover Letter</p>
              <p className='mb-0' style={{ whiteSpace: 'pre-wrap' }}>
                {application.cover_letter || '-'}
              </p>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Notes</CardTitle>
        </CardHeader>
        <CardBody>
          <NotesSection notes={store.notes} onAddNote={handleAddNote} canAdd={canEdit} submitting={noteSaving} />
        </CardBody>
      </Card>
    </div>
  )
}

export default JobApplicationView
