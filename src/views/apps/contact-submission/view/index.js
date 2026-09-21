import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Trash2 } from 'react-feather'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Button } from 'reactstrap'
import { getContactSubmission, deleteContactSubmission } from '../store'
import { formatDate } from '@utils'
import { confirmDelete } from '@src/utility/confirmDelete'
import { currentUserCan } from '@src/utility/navPermissions'

const Field = ({ label, children }) => (
  <Col md='6' className='mb-2'>
    <p className='text-muted mb-0'>{label}</p>
    <p className='mb-0'>{children || '-'}</p>
  </Col>
)

const ContactSubmissionView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.contactSubmissions)

  useEffect(() => {
    dispatch(getContactSubmission(id))
  }, [dispatch, id])

  const contact = store.selectedContactSubmission

  if (!contact || contact.id !== Number(id)) {
    return null
  }

  const handleDelete = () => {
    confirmDelete({
      text: `This will permanently delete the submission from "${contact.full_name}".`,
      onConfirm: () =>
        dispatch(deleteContactSubmission(contact.id))
          .unwrap()
          .then(() => {
            toast.success('Contact submission deleted')
            navigate('/contact-submission')
          })
          .catch(err => toast.error(err?.message || 'Failed to delete'))
    })
  }

  return (
    <div>
      <Card>
        <CardBody className='d-flex justify-content-between flex-md-row flex-column'>
          <div>
            <h3 className='mb-0'>{contact.full_name}</h3>
            <p className='text-muted mb-1'>{contact.reference_id}</p>
            <p className='mb-0'>
              {contact.email} {contact.phone ? `• ${contact.phone}` : ''}
            </p>
          </div>
          {currentUserCan('/contact-submission', 'delete') && (
            <div className='d-flex flex-column align-items-md-end mt-md-0 mt-2'>
              <Button color='danger' outline onClick={handleDelete}>
                <Trash2 size={14} className='me-50' /> Delete
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Submission Details</CardTitle>
        </CardHeader>
        <CardBody>
          <Row>
            <Field label='Full Name'>{contact.full_name}</Field>
            <Field label='Email'>{contact.email}</Field>
            <Field label='Phone'>{contact.phone}</Field>
            <Field label='Company'>{contact.company_name}</Field>
            <Field label='Service Required'>{contact.service_required}</Field>
            <Field label='Project Budget'>{contact.project_budget}</Field>
            <Field label='Source'>{contact.source}</Field>
            <Field label='Submitted'>{formatDate(contact.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</Field>
          </Row>
          <Row>
            <Col md='12' className='mb-2'>
              <p className='text-muted mb-0'>Message</p>
              <p className='mb-0' style={{ whiteSpace: 'pre-wrap' }}>
                {contact.message}
              </p>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </div>
  )
}

export default ContactSubmissionView
