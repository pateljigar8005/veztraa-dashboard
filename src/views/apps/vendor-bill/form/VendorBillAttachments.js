import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import AttachmentsField from '../../shared/AttachmentsField'
import { confirmDelete } from '@src/utility/confirmDelete'
import { getVendorBillAttachments, uploadVendorBillAttachment, deleteVendorBillAttachment } from '../store'

const VendorBillAttachments = ({ billId }) => {
  const dispatch = useDispatch()
  const attachments = useSelector(state => state.vendorBills.attachments)

  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    dispatch(getVendorBillAttachments(billId))
  }, [billId])

  const handleFilesSelect = async files => {
    setUploading(true)
    let successCount = 0
    for (const file of files) {
      try {
        await dispatch(uploadVendorBillAttachment({ billId, file })).unwrap()
        successCount++
      } catch (err) {
        const message = err?.response?.data?.message || `Failed to upload "${file.name}"`
        toast.error(message)
      }
    }
    setUploading(false)
    if (successCount > 0) toast.success(successCount === 1 ? 'File uploaded' : `${successCount} files uploaded`)
  }

  const handleDelete = file => {
    confirmDelete({
      text: `This will permanently delete "${file.file_name}".`,
      onConfirm: () => dispatch(deleteVendorBillAttachment(file.id)).unwrap().then(() => toast.success('Attachment deleted')).catch(err => toast.error(err?.message || 'Failed to delete'))
    })
  }

  const handleDownload = async file => {
    setDownloadingId(file.id)
    try {
      const response = await axios.get(`/vendor-bill-attachments/${file.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Failed to download attachment')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <AttachmentsField
      attachments={attachments}
      uploading={uploading}
      downloadingId={downloadingId}
      onFilesSelect={handleFilesSelect}
      onDownload={handleDownload}
      onDelete={handleDelete}
      helperText='Bill document: PDF, Word, Excel, TXT, CSV, JPG or PNG — max 5MB each.'
    />
  )
}

export default VendorBillAttachments
