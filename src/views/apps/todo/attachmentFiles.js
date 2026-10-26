import axios from 'axios'

// Must match TodoAttachmentController::CHUNK_SIZE.
const CHUNK_SIZE = 1024 * 1024

const randomUploadId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')

// Uploads a file 1MB at a time, in order. Resolves with the saved attachment
// (the last chunk's response).
export const uploadInChunks = async (issueId, file) => {
  const uploadId = randomUploadId()
  const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))
  let response = null
  for (let index = 0; index < total; index++) {
    const formData = new FormData()
    formData.append('upload_id', uploadId)
    formData.append('index', index)
    formData.append('total', total)
    formData.append('file_name', file.name)
    formData.append('chunk', file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE), file.name)
    response = await axios.post(`/todos/${issueId}/attachments/chunks`, formData)
  }
  return response.data.data
}

// Short-lived signed URLs the browser can open on its own (a new tab can't
// carry our Authorization header). The API streams them with Range support.
const signedUrls = async attachmentId => {
  const { data } = await axios.get(`/todo-attachments/${attachmentId}/link`)
  return {
    view: `${axios.defaults.baseURL}${data.data.view_path}`,
    download: `${axios.defaults.baseURL}${data.data.download_path}`
  }
}

// The tab is opened right away (inside the click) so popup blockers allow
// it, then pointed at the file once the link is ready.
export const openInNewTab = async attachmentId => {
  const tab = window.open('', '_blank')
  try {
    const { view } = await signedUrls(attachmentId)
    if (tab) tab.location.href = view
    else window.location.href = view
  } catch (err) {
    tab?.close()
    throw err
  }
}

// Hands the download to the browser itself, so it streams to disk (and can
// resume) instead of being loaded whole into memory first.
export const downloadFile = async attachmentId => {
  const { download } = await signedUrls(attachmentId)
  const a = document.createElement('a')
  a.href = download
  document.body.appendChild(a)
  a.click()
  a.remove()
}
