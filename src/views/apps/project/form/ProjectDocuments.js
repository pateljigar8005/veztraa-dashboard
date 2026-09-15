// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'

// ** Shared Components
import AttachmentsField from '../../shared/AttachmentsField'
import { confirmDelete } from '@src/utility/confirmDelete'

// ** Store & Actions
import { getProjectDocuments, uploadProjectDocument, deleteProjectDocument } from '../store'

const ProjectDocuments = ({ projectId }) => {
  const dispatch = useDispatch()
  const documents = useSelector(state => state.projects.documents)

  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    dispatch(getProjectDocuments(projectId))
  }, [projectId])

  // Uploaded one at a time (not a single multipart batch) - keeps each
  // request's success/failure independent, so one oversized or invalid file
  // in a batch doesn't block the rest from going through.
  const handleFilesSelect = async files => {
    setUploading(true)
    let successCount = 0
    for (const file of files) {
      try {
        await dispatch(uploadProjectDocument({ projectId, file })).unwrap()
        successCount++
      } catch (err) {
        const message = err?.response?.data?.message || `Failed to upload "${file.name}"`
        toast.error(message)
      }
    }
    setUploading(false)
    if (successCount > 0) toast.success(successCount === 1 ? 'Document uploaded' : `${successCount} documents uploaded`)
  }

  const handleDelete = doc => {
    confirmDelete({
      text: `This will permanently delete "${doc.file_name}".`,
      onConfirm: () => dispatch(deleteProjectDocument(doc.id)).then(() => toast.success('Document deleted'))
    })
  }

  const handleDownload = async doc => {
    setDownloadingId(doc.id)
    try {
      const response = await axios.get(`/project-documents/${doc.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Failed to download document')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <AttachmentsField
      attachments={documents}
      uploading={uploading}
      downloadingId={downloadingId}
      onFilesSelect={handleFilesSelect}
      onDownload={handleDownload}
      onDelete={handleDelete}
    />
  )
}

export default ProjectDocuments
