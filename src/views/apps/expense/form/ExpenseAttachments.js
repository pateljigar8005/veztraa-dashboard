import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import AttachmentsField from '../../shared/AttachmentsField'
import { confirmDelete } from '@src/utility/confirmDelete'
import { getExpenseAttachments, uploadExpenseAttachment, deleteExpenseAttachment } from '../store'

const ExpenseAttachments = ({ expenseId }) => {
  const dispatch = useDispatch()
  const attachments = useSelector(state => state.expenses.attachments)

  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    dispatch(getExpenseAttachments(expenseId))
  }, [expenseId])

  const handleFilesSelect = async files => {
    setUploading(true)
    let successCount = 0
    for (const file of files) {
      try {
        await dispatch(uploadExpenseAttachment({ expenseId, file })).unwrap()
        successCount++
      } catch (err) {
        const message = err?.response?.data?.message || `Failed to upload "${file.name}"`
        toast.error(message)
      }
    }
    setUploading(false)
    if (successCount > 0) toast.success(successCount === 1 ? 'Receipt uploaded' : `${successCount} receipts uploaded`)
  }

  const handleDelete = file => {
    confirmDelete({
      text: `This will permanently delete "${file.file_name}".`,
      onConfirm: () => dispatch(deleteExpenseAttachment(file.id)).unwrap().then(() => toast.success('Attachment deleted')).catch(err => toast.error(err?.message || 'Failed to delete'))
    })
  }

  const handleDownload = async file => {
    setDownloadingId(file.id)
    try {
      const response = await axios.get(`/expense-attachments/${file.id}/download`, { responseType: 'blob' })
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
      helperText='Receipts: PDF, Word, Excel, TXT, CSV, JPG or PNG — max 5MB each.'
    />
  )
}

export default ExpenseAttachments
