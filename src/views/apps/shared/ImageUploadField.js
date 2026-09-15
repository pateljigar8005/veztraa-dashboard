// ** Third Party Components
import { Button } from 'reactstrap'
import { Trash2 } from 'react-feather'

// ** Shared Components
import DropzoneFileInput from './DropzoneFileInput'

// ** Full-width image upload: a taller dropzone with the uploaded picture
// (if any) shown below it, rather than a small avatar preview sitting
// beside a narrow dropzone. Used wherever a form needs a single image
// upload (Team Member photo, Portfolio project image, Case Study cover).
const ImageUploadField = ({ preview, onFileSelect, onRemove, helperText }) => {
  return (
    <div>
      <DropzoneFileInput onFileSelect={onFileSelect} helperText={helperText} minHeight='180px' />
      {preview && (
        <div className='mt-1 d-inline-block position-relative'>
          <img
            src={preview}
            alt='Uploaded preview'
            className='border'
            style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: 0, display: 'block' }}
          />
          <Button
            type='button'
            color='danger'
            size='sm'
            className='btn-icon'
            style={{ position: 'absolute', top: '-10px', right: '-10px', borderRadius: '50%', padding: '0.4rem' }}
            onClick={onRemove}
            title='Remove image'
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}

export default ImageUploadField
