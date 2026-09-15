// ** React Imports
import { useCallback } from 'react'

// ** Third Party Components
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { UploadCloud } from 'react-feather'

// ** Styles
import '@styles/react/libs/file-uploader/file-uploader.scss'

const DEFAULT_ACCEPT = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }

// ** Compact drag-and-drop file picker, used wherever a form needs a single
// image upload (Team Member photo, Portfolio project image, ...). Wraps
// react-dropzone with the Vuexy `.dropzone` styling, sized down from its
// 300px demo default to fit inline next to an avatar/image preview.
const DropzoneFileInput = ({
  onFileSelect,
  onFilesSelect,
  multiple = false,
  accept = DEFAULT_ACCEPT,
  maxSize = 2 * 1024 * 1024,
  helperText,
  minHeight = '90px'
}) => {
  const onDrop = useCallback(
    acceptedFiles => {
      if (acceptedFiles.length === 0) return
      // Multi mode hands back every dropped file at once (onFilesSelect);
      // single mode (the original/default behavior) only ever wants the one.
      if (multiple) {
        onFilesSelect(acceptedFiles)
      } else {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect, onFilesSelect, multiple]
  )

  const onDropRejected = useCallback(fileRejections => {
    const reason = fileRejections[0]?.errors?.[0]?.code
    if (reason === 'file-too-large') {
      toast.error(`File is too large - max ${(maxSize / (1024 * 1024)).toFixed(0)}MB.`)
    } else if (reason === 'file-invalid-type') {
      toast.error('Unsupported file type.')
    } else {
      toast.error('File could not be uploaded.')
    }
  }, [maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxSize,
    multiple
  })

  return (
    <div
      {...getRootProps({ className: 'dropzone' })}
      style={{
        minHeight,
        flexDirection: 'column',
        // The shared .dropzone scss sets align-items to the invalid string
        // 'center' (quoted, not the keyword), so it's silently ignored -
        // set it here instead to actually center the icon/text horizontally.
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        gap: '0.5rem'
      }}
    >
      <input {...getInputProps()} />
      <UploadCloud size={40} className='text-primary' />
      <p className='mb-0 text-center small'>
        {isDragActive
          ? 'Drop the file(s) here...'
          : `Drag & drop ${multiple ? 'file(s)' : 'a file'} here, or click to browse`}
      </p>
      {helperText && <p className='text-muted small mb-0 text-center'>{helperText}</p>}
    </div>
  )
}

export default DropzoneFileInput
