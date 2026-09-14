// @veztraa/report-designer injects a global, unscoped Tailwind stylesheet
// straight into `document.head` the moment it's first mounted anywhere in the
// app. Left alone, that stylesheet resets every element on the page (borders,
// outlines, spacing, etc.) for at least one paint before anything can react -
// visible as a flash/outline flicker across the whole UI on a hard reload
// landing directly on the PDF Designer page.
//
// An earlier version of this fix rendered the designer inside an isolated
// <iframe> so its CSS couldn't reach the rest of the app. That contained the
// CSS but broke the designer's own drag-and-drop: the widget attaches its drag
// listeners via the bare `document`/`window` captured at module-load time,
// which is always the PARENT document (React portals move DOM nodes into the
// iframe, not the module's own document reference) - so mouse events firing
// inside the iframe's separate document never reached those listeners.
//
// This fix instead scopes the stylesheet's own selectors (using the browser's
// CSSOM, not a hand-rolled parser) so every rule only applies inside a single
// container id, then injects that scoped copy into the real `document.head`
// and leaves it there for the rest of the session - harmless since it can
// only ever affect elements inside that container, no matter which page is
// showing. The designer then renders directly in the normal DOM (see its
// form/index.js), so drag-and-drop, keyboard shortcuts etc. all work exactly
// as they would un-isolated.

export const PDF_DESIGNER_SCOPE_ID = 'pdf-designer-scope'
export const PDF_DESIGNER_SCOPED_STYLE_ID = 'pdf-designer-scoped-css'

const isDesignerGlobalCss = node => {
  if (node.nodeType !== 1) return false
  if (node.id === PDF_DESIGNER_SCOPED_STYLE_ID) return false
  if (node.tagName === 'STYLE') {
    const text = node.textContent || ''
    return text.includes('fontsource') || text.includes('--tw-')
  }
  if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
    return (node.href || '').includes('fontsource')
  }
  return false
}

const GROUPING_RULE_TYPES = new Set([CSSRule.MEDIA_RULE, CSSRule.SUPPORTS_RULE])

// `:root` carries the widget's CSS custom properties (--panel, --border,
// --text-1 etc.) that the rest of its stylesheet reads via var(...). Most of
// the widget renders inside the scope container, so scoping `:root` down to
// just that container (as every other selector is scoped) is enough for
// those to resolve. But some of its own popovers (e.g. the field picker,
// `position: fixed`) render through a portal appended outside the scope
// container - not a descendant of it - so they can't see custom properties
// defined there and fall back to invalid/transparent. Keeping `:root` as a
// second, unscoped target alongside the container fixes that: these
// variable names are specific to this widget, so defining them globally too
// doesn't leak anything visible into the rest of the app.
const scopeSelectorList = (selectorText, scopeSel) =>
  selectorText
    .split(',')
    .map(s => s.trim())
    .map(s => (s === ':root' ? `:root, ${scopeSel}` : `${scopeSel} ${s}`))
    .join(', ')

const scopeRules = (rules, scopeSel) => {
  Array.from(rules).forEach(rule => {
    if (rule.type === CSSRule.STYLE_RULE) {
      rule.selectorText = scopeSelectorList(rule.selectorText, scopeSel)
    } else if (GROUPING_RULE_TYPES.has(rule.type)) {
      scopeRules(rule.cssRules, scopeSel)
    }
    // @font-face, @keyframes, @import, @charset etc: left untouched - they
    // don't target elements by selector, so there's nothing to scope.
  })
}

// Strips leading @import lines (safe to keep global - they only define
// @font-face rules, never select elements) and scopes everything else.
const scopeCss = cssText => {
  const importLines = []
  const rest = cssText.replace(/@import\s*[^;]+;/g, match => {
    importLines.push(match)
    return ''
  })

  const sheet = new CSSStyleSheet()
  sheet.replaceSync(rest)
  scopeRules(sheet.cssRules, `#${PDF_DESIGNER_SCOPE_ID}`)
  const scopedRest = Array.from(sheet.cssRules)
    .map(r => r.cssText)
    .join('\n')

  return importLines.join('\n') + '\n' + scopedRest
}

let scopedStyleInjected = false

const injectScopedStyle = cssText => {
  if (scopedStyleInjected || document.getElementById(PDF_DESIGNER_SCOPED_STYLE_ID)) return

  let scoped
  try {
    scoped = scopeCss(cssText)
  } catch (e) {
    // If parsing ever fails, fall back to the raw text rather than losing the
    // designer's styling entirely - it may leak globally in this rare case,
    // but that's still better than an unstyled/broken widget.
    console.warn('[reportDesignerStyleGuard] failed to scope CSS, injecting unscoped as a fallback', e)
    scoped = cssText
  }

  const style = document.createElement('style')
  style.id = PDF_DESIGNER_SCOPED_STYLE_ID
  style.textContent = scoped
  document.head.appendChild(style)
  scopedStyleInjected = true
}

const intercept = node => {
  if (!isDesignerGlobalCss(node)) return

  // Neutralize before the browser can apply it, then remove it - only the
  // scoped copy we inject ourselves is kept.
  node.media = 'not all'

  if (node.tagName === 'STYLE') {
    injectScopedStyle(node.textContent)
  }
  // A <link rel="stylesheet"> matching isDesignerGlobalCss (unlikely - the
  // widget only ever uses a single inline <style> in practice) is just left
  // disabled: scoping it would require fetching and parsing it too, and
  // nothing currently relies on that path.

  node.remove()
}

if (typeof document !== 'undefined') {
  Array.from(document.head.childNodes).forEach(intercept)

  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(intercept))
  })
  observer.observe(document.head, { childList: true })
}
