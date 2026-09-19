import { useEffect, useRef, useState } from 'react'

const EmailBodyFrame = ({ html }) => {
  const iframeRef = useRef(null)
  const [height, setHeight] = useState(200)

  const wheelCleanupRef = useRef(null)

  const forwardWheel = e => {
    iframeRef.current?.dispatchEvent(
      new WheelEvent('wheel', { deltaY: e.deltaY, deltaX: e.deltaX, deltaMode: e.deltaMode, bubbles: true, cancelable: true })
    )
  }

  const attachWheelForwarding = () => {
    wheelCleanupRef.current?.()
    wheelCleanupRef.current = null

    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.addEventListener('wheel', forwardWheel, { passive: true })
    wheelCleanupRef.current = () => win.removeEventListener('wheel', forwardWheel)
  }

  const resize = () => {
    const doc = iframeRef.current?.contentDocument
    if (doc?.body) {
      setHeight(doc.body.scrollHeight + 24)
    }
    attachWheelForwarding()
  }

  useEffect(() => {
    resize()
    return () => {
      wheelCleanupRef.current?.()
      wheelCleanupRef.current = null
    }
  }, [html])

  const srcDoc = `<!DOCTYPE html><html><head><base target="_blank"><meta charset="utf-8"><style>
    html, body { margin: 0; padding: 0; }
    body { padding: 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #333; word-wrap: break-word; overflow-wrap: break-word; }
    img { max-width: 100%; height: auto; }
    table { max-width: 100%; }
  </style></head><body>${html || ''}</body></html>`

  return (
    <iframe
      ref={iframeRef}
      title='Email content'
      sandbox='allow-same-origin allow-popups'
      srcDoc={srcDoc}
      onLoad={resize}
      style={{ width: '100%', height, border: 0, display: 'block' }}
    />
  )
}

export default EmailBodyFrame