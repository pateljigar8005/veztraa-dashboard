import { FileText, Download, Trash2 } from 'react-feather'
import { Button, Spinner } from 'reactstrap'
import DropzoneFileInput from './DropzoneFileInput'
export const ATTACHMENT_MAX_SIZE = 5 * 1024 * 1024


export const ATTACHMENT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
}

export const formatFileSize = bytes => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const AttachmentsField = ({
  attachments,
  uploading,
  downloadingId,
  onFilesSelect,
  onDownload,
  onDelete,
  maxSize = ATTACHMENT_MAX_SIZE,
  accept = ATTACHMENT_ACCEPT,
  helperText = 'PDF, Word, Excel, PowerPoint, TXT, CSV, JPG or PNG — max 5MB each.'
}) => {
  return (
    <div>
      <DropzoneFileInput multiple onFilesSelect={onFilesSelect} accept={accept} maxSize={maxSize} helperText={helperText} />
      {uploading && (
        <div className='text-muted small mt-1 d-flex align-items-center' style={{ gap: '0.4rem' }}>
          <Spinner size='sm' /> Uploading...
        </div>
      )}
      {attachments.length > 0 && (
        <div className='mt-1'>
          {attachments.map(file => (
            <div key={file.id} className='d-flex align-items-center justify-content-between border rounded p-50 mb-50'>
              <div className='d-flex align-items-center overflow-hidden' style={{ gap: '0.6rem', minWidth: 0 }}>
                <FileText size={18} className='text-primary flex-shrink-0' />
                <div className='overflow-hidden' style={{ minWidth: 0 }}>
                  <div className='text-truncate' title={file.file_name}>
                    {file.file_name}
                  </div>
                  <small className='text-muted'>{formatFileSize(file.file_size)}</small>
                </div>
              </div>
              <div className='d-flex align-items-center flex-shrink-0' style={{ gap: '0.25rem' }}>
                <Button
                  type='button'
                  color='flat-primary'
                  className='btn-icon'
                  size='sm'
                  disabled={downloadingId === file.id}
                  onClick={() => onDownload(file)}
                  title='Download'
                >
                  <Download size={16} />
                </Button>
                <Button
                  type='button'
                  color='flat-danger'
                  className='btn-icon'
                  size='sm'
                  onClick={() => onDelete(file)}
                  title='Delete'
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AttachmentsField