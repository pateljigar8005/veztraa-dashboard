
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
  })
}

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

  node.media = 'not all'

  if (node.tagName === 'STYLE') {
    injectScopedStyle(node.textContent)
  }

  node.remove()
}

if (typeof document !== 'undefined') {
  Array.from(document.head.childNodes).forEach(intercept)

  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(intercept))
  })
  observer.observe(document.head, { childList: true })
}