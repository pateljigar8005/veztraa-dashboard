// ** React Imports
import { useEffect, useRef, useState } from 'react'

// Renders untrusted email HTML inside a sandboxed iframe instead of
// injecting it directly into the page. Emails routinely ship their own
// <style>/<script> tags (marketing templates especially) - dropped straight
// into the page via dangerouslySetInnerHTML, those apply GLOBALLY, not just
// to the email content. This is exactly how a real email's own
// ".content { max-width: 680px }" rule (from its own content wrapper div)
// collided with our app-shell's own ".content" class and shrank the entire
// page around it.
//
// sandbox="allow-same-origin allow-popups" only - no allow-scripts, so an
// embedded <script> tag in an email can never execute. allow-same-origin is
// only there so we can read the iframe's own content height to auto-size it
// (no double scrollbar); it grants no scripting capability by itself.
// allow-popups lets a normal target="_blank" link actually open a new tab.
const EmailBodyFrame = ({ html }) => {
  const iframeRef = useRef(null)
  const [height, setHeight] = useState(200)

  // The iframe is sized to fit its content exactly, so it never scrolls
  // internally - but that also means a wheel event over it has nowhere to
  // go: iframes are a separate document, so the event never reaches the
  // page's own PerfectScrollbar container the way it would over a plain
  // <div>. Forward it manually by replaying the same wheel event on the
  // iframe's own element in the parent document, letting it bubble up to
  // PerfectScrollbar exactly like a native scroll would.
  //
  // contentWindow persists across srcDoc reloads (only contentDocument
  // changes), so the listener has to be explicitly torn down and re-added
  // on every load - otherwise switching between messages piles up duplicate
  // listeners on the same window, and scrolling would visibly accelerate
  // with every message opened.
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
