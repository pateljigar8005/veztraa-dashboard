// Client-side resize/crop (canvas API) + direct browser-to-R2 upload for
// every image upload site in the app. The file never transits our own API -
// see UploadController::presign() on the backend, which only ever mints a
// presigned PUT URL and never receives file bytes. Replaces what used to be
// a multipart POST + server-side GD resize (UploadController::compressImage(),
// UserController::squareThumbnail(), etc.) for each of these call sites.
import axios from 'axios'

const EDITOR_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml'
}

const extensionOf = file => (file.name || '').split('.').pop().toLowerCase()

const loadImage = file =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read image'))
    }
    img.src = objectUrl
  })

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Image encoding failed'))), type, quality)
  })

// Downscales (never upscales) to `maxDimension` on the longer side,
// preserving aspect ratio and transparency - same idea as the old
// UploadController::compressImage(), just done client-side. SVG (vector,
// nothing to downscale) and GIF (may be animated - a canvas re-encode would
// flatten it to one frame) pass through untouched.
export const resizeToFit = async (file, maxDimension = 1600, quality = 0.82) => {
  const ext = extensionOf(file)
  if (!(ext in EDITOR_MIME)) {
    throw new Error('Invalid file type')
  }
  if (ext === 'svg' || ext === 'gif') {
    return { blob: file, ext, contentType: EDITOR_MIME[ext] }
  }

  const img = await loadImage(file)
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  const outExt = ext === 'jpeg' ? 'jpg' : ext
  const contentType = EDITOR_MIME[outExt]
  const blob = await canvasToBlob(canvas, contentType, quality)
  return { blob, ext: outExt, contentType }
}

// Downscales to fit `maxDimension` (never upscales, never crops), always as
// JPEG (flattened onto white) regardless of source format - matches the old
// PortfolioItemController/CaseStudyController::resizeToFit(), which forced
// JPEG output too. Distinct from resizeToFit() above (editor purpose only),
// which preserves PNG/WebP - portfolio/case-study/team-photo purposes only
// ever accept a jpg extension server-side (see UploadController::PURPOSES).
export const resizeToJpeg = async (file, maxDimension = 1200, quality = 0.85) => {
  const img = await loadImage(file)
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  return { blob, ext: 'jpg', contentType: 'image/jpeg' }
}

// Center-crops to a square then downscales to `size`x`size`, always as JPEG
// (flattened onto white - JPEG has no alpha channel) regardless of the
// source format - same shape as the old server-side squareThumbnail().
export const squareCrop = async (file, size, quality = 0.85) => {
  const img = await loadImage(file)
  const cropSize = Math.min(img.width, img.height)
  const srcX = (img.width - cropSize) / 2
  const srcY = (img.height - cropSize) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.drawImage(img, srcX, srcY, cropSize, cropSize, 0, 0, size, size)

  const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  return { blob, ext: 'jpg', contentType: 'image/jpeg' }
}

// Asks the API for a presigned R2 PUT URL for `purpose` (see
// UploadController::PURPOSES), then PUTs `blob` straight to R2 - the API
// never sees the bytes. Must send back the exact Content-Type/Cache-Control
// the API signed, or R2 rejects the request (see R2Client::presignPut()).
export const uploadToR2 = async (purpose, { blob, ext, contentType }) => {
  const presigned = await axios.post('/uploads/presign', {
    purpose,
    extension: ext,
    size: blob.size
  })
  const { uploadUrl, url, headers } = presigned.data.data

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': headers['Content-Type'],
      'Cache-Control': headers['Cache-Control']
    },
    body: blob
  })
  if (!putResponse.ok) {
    throw new Error('Upload to storage failed')
  }

  return url
}
