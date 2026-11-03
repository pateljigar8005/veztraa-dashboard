import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Download, Eye, FileText } from 'react-feather'
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap'
import PdfPreviewSkeleton from '../../shared/PdfPreviewSkeleton'

// Resumes are PDF, DOC or DOCX (PublicCareerController). A PDF previews
// right in the modal; the browser can't render Word files, so those just get
// a download button. The file lives outside the docroot, so it's fetched as
// a blob through the authenticated API rather than linked to directly.
const EXTENSIONS = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
}

const ResumePreviewModal = ({ application }) => {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState(null)

  // Fetched once, the first time the modal opens.
  useEffect(() => {
    if (!open || file) return
    axios
      .get(`/job-applications/${application.id}/resume`, { responseType: 'blob' })
      .then(response => {
        const type = (response.data.type || '').split(';')[0]
        setFile({ url: URL.createObjectURL(response.data), type, ext: EXTENSIONS[type] || '' })
      })
      .catch(() => {
        toast.error('Failed to load resume')
        setOpen(false)
      })
  }, [open])

  useEffect(() => () => file && URL.revokeObjectURL(file.url), [file])

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = file.url
    a.download = `${application.full_name} - Resume${file.ext ? `.${file.ext}` : ''}`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const isPdf = file?.type === 'application/pdf'

  return (
    <>
      <Button color='primary' outline onClick={() => setOpen(true)}>
        <Eye size={14} className='me-50' />
        View Resume
      </Button>
      <Modal isOpen={open} toggle={() => setOpen(false)} size='xl' centered>
        <ModalHeader toggle={() => setOpen(false)} tag='div' className='w-100'>
          <div className='d-flex align-items-center justify-content-between w-100' style={{ gap: '1rem' }}>
            <h5 className='modal-title mb-0'>{application.full_name} - Resume</h5>
            <Button color='primary' size='sm' className='me-1' disabled={!file} onClick={handleDownload}>
              <Download size={14} className='me-50' />
              Download
            </Button>
          </div>
        </ModalHeader>
        <ModalBody className='p-0'>
          {!file ? (
            <PdfPreviewSkeleton />
          ) : isPdf ? (
            <iframe title='Resume' src={file.url} style={{ width: '100%', height: '75vh', border: 0, display: 'block' }} />
          ) : (
            <div className='d-flex flex-column align-items-center text-center py-5 px-2'>
              <div className='avatar avatar-xl bg-light-primary mb-1'>
                <div className='avatar-content'>
                  <FileText size={28} />
                </div>
              </div>
              <h5 className='mb-50'>Preview not available</h5>
              <p className='text-muted mb-2'>
                This resume is a Word document{file.ext ? ` (.${file.ext})` : ''}, which browsers can't show. Download it to open.
              </p>
              <Button color='primary' onClick={handleDownload}>
                <Download size={14} className='me-50' />
                Download Resume
              </Button>
            </div>
          )}
        </ModalBody>
      </Modal>
    </>
  )
}

export default ResumePreviewModal
