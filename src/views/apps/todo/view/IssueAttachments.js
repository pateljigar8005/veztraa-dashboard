import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Spinner } from 'reactstrap'
import { Download, Trash2 } from 'react-feather'
import DropzoneFileInput from '../../shared/DropzoneFileInput'
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_SIZE, formatFileSize } from '../../shared/AttachmentsField'
import { getFileTypeIcon } from '../../shared/getFileTypeIcon'
import { confirmDelete } from '@src/utility/confirmDelete'
import { getTaskAttachments, uploadTaskAttachment, deleteTaskAttachment } from '../store'
import { openInNewTab, downloadFile } from '../attachmentFiles'

const TILE = 170

// Tint per file type for files that can't be previewed.
const TYPE_COLOR = {
  pdf: 'danger',
  doc: 'info',
  docx: 'info',
  xls: 'success',
  xlsx: 'success',
  csv: 'success',
  ppt: 'warning',
  pptx: 'warning',
  txt: 'secondary'
}

const extensionOf = name => (name || '').split('.').pop()?.toLowerCase() || ''

const roundButton = {
  borderRadius: '50%',
  padding: '0.4rem',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
}

// Images show the picture, PDFs their first page, anything else a big
// file-type icon - same tile style as the profile picture upload.
const Preview = ({ file }) => {
  const url = file.preview_path ? `${axios.defaults.baseURL}${file.preview_path}` : null
  const ext = extensionOf(file.file_name)

  if (url && file.mime_type?.startsWith('image/')) {
    return (
      <img
        src={url}
        alt={file.file_name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    )
  }
  if (url && file.mime_type === 'application/pdf') {
    return (
      <iframe
        src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        title={file.file_name}
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          pointerEvents: 'none',
          background: '#fff'
        }}
      />
    )
  }

  const Icon = getFileTypeIcon(file.file_name)
  const color = TYPE_COLOR[ext] || 'secondary'
  return (
    <div className={`bg-light-${color} d-flex flex-column align-items-center justify-content-center h-100`}>
      <Icon size={44} />
      <span className='fw-bolder mt-50 text-uppercase' style={{ letterSpacing: '0.05em' }}>
        {ext || 'file'}
      </span>
    </div>
  )
}

const IssueAttachments = ({ taskId }) => {
  const dispatch = useDispatch()
  const attachments = useSelector(state => state.todo.attachments)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    dispatch(getTaskAttachments(taskId))
  }, [taskId])

  const handleFilesSelect = async files => {
    setUploading(true)
    let successCount = 0
    for (const file of files) {
      try {
        await dispatch(uploadTaskAttachment({ taskId, file })).unwrap()
        successCount++
      } catch (err) {
        toast.error(err?.message || `Failed to upload "${file.name}"`)
      }
    }
    setUploading(false)
    if (successCount > 0) toast.success(successCount === 1 ? 'Attachment uploaded' : `${successCount} attachments uploaded`)
  }

  const handleDelete = file =>
    confirmDelete({
      text: `This will permanently delete "${file.file_name}".`,
      onConfirm: () =>
        dispatch(deleteTaskAttachment({ id: file.id, taskId }))
          .unwrap()
          .then(() => toast.success('Attachment deleted'))
          .catch(err => toast.error(err?.message || 'Failed to delete'))
    })

  const handleView = file => openInNewTab(file.id).catch(() => toast.error('Failed to open attachment'))
  const handleDownload = file => downloadFile(file.id).catch(() => toast.error('Failed to download attachment'))

  return (
    <div>
      <DropzoneFileInput
        multiple
        onFilesSelect={handleFilesSelect}
        accept={ATTACHMENT_ACCEPT}
        maxSize={ATTACHMENT_MAX_SIZE}
        helperText='PDF, Word, Excel, PowerPoint, TXT, CSV, JPG or PNG — max 5MB each.'
      />
      {uploading && (
        <div className='text-muted small mt-1 d-flex align-items-center' style={{ gap: '0.4rem' }}>
          <Spinner size='sm' /> Uploading...
        </div>
      )}
      {attachments.length > 0 && (
        <div className='d-flex flex-wrap mt-1' style={{ gap: '1.25rem' }}>
          {attachments.map(file => (
            <div key={file.id} style={{ width: TILE }}>
              <div className='position-relative'>
                <div
                  className='border rounded overflow-hidden cursor-pointer'
                  style={{ width: TILE, height: TILE }}
                  title={`Open ${file.file_name}`}
                  onClick={() => handleView(file)}
                >
                  <Preview file={file} />
                </div>
                <Button
                  type='button'
                  color='danger'
                  size='sm'
                  className='btn-icon'
                  style={{
                    ...roundButton,
                    position: 'absolute',
                    top: -10,
                    right: -10
                  }}
                  onClick={() => handleDelete(file)}
                  title='Delete'
                >
                  <Trash2 size={14} />
                </Button>
                <Button
                  type='button'
                  color='primary'
                  size='sm'
                  className='btn-icon'
                  style={{
                    ...roundButton,
                    position: 'absolute',
                    bottom: 8,
                    right: 8
                  }}
                  onClick={() => handleDownload(file)}
                  title='Download'
                >
                  <Download size={14} />
                </Button>
              </div>
              <div className='mt-50 text-truncate fw-bolder' style={{ fontSize: '0.85rem' }} title={file.file_name}>
                {file.file_name}
              </div>
              <small className='text-muted'>{formatFileSize(file.file_size)}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default IssueAttachments
