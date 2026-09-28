// Applies the company-wide theme color instantly, without ever reading it
// from the API before paint. The color itself is cached in localStorage and
// re-applied synchronously (see src/index.js) before React renders anything,
// so repeat visits never show a flash of the default color. The API is only
// consulted afterwards, in the background, to pick up a change made from
// another device/browser.
export const THEME_COLOR_STORAGE_KEY = 'veztraaThemeColor'
export const DEFAULT_THEME_COLOR = '#7367f0'
const STYLE_TAG_ID = 'theme-color-override'

const hexToRgb = hex => {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const int = parseInt(full, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

const clamp255 = v => Math.max(0, Math.min(255, Math.round(v)))

const rgbToHex = ([r, g, b]) =>
  '#' + [r, g, b].map(v => clamp255(v).toString(16).padStart(2, '0')).join('')

const mix = (rgb, target, weight) => rgb.map((v, i) => v + (target[i] - v) * weight)

const shade = (hex, weight) => rgbToHex(mix(hexToRgb(hex), [0, 0, 0], weight))
const tint = (hex, weight) => rgbToHex(mix(hexToRgb(hex), [255, 255, 255], weight))

export const isValidHexColor = hex => /^#[0-9a-fA-F]{6}$/.test(hex || '')

// Picks readable text for a solid background of this color (YIQ perceived-
// brightness formula - a standard, cheap approximation of what's legible).
// Lets the theme color itself be light or dark without any element that
// paints text on top of it (buttons, active menu items, badges...) going
// unreadable.
export const getContrastText = hex => {
  const [r, g, b] = hexToRgb(hex)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 150 ? '#1e1e1e' : '#ffffff'
}

// Overrides the CSS custom properties and utility/component classes that
// Vuexy's compiled Bootstrap CSS uses for "primary" (buttons, links, badges,
// active nav/menu items, form checks/switches, focus rings). A handful of
// deeply-nested hover shades that Bootstrap's SCSS bakes in at compile time
// aren't reachable this way - those only change on a real rebuild - but
// every commonly-seen primary-colored element updates instantly.
export const buildThemeColorCSS = hex => {
  const rgb = hexToRgb(hex).join(', ')
  const hoverBg = shade(hex, 0.15)
  const activeBg = shade(hex, 0.2)
  const lightBg = tint(hex, 0.84)
  const borderSubtle = tint(hex, 0.6)
  const focusBorder = tint(hex, 0.4)
  const contrastText = getContrastText(hex)

  // Every rule below uses !important AND is prefixed with the `[dir]`
  // attribute selector. That's not decorative: Vuexy's own compiled CSS
  // hardcodes rules like `[dir] .btn-primary{background-color:...!important}`
  // for every "primary" component, and `[dir]` (always present - the app's
  // <html> always has a dir attribute) adds one extra unit of specificity.
  // Two `!important` declarations don't tie-break on source order - the
  // more specific one always wins regardless of which one loads later - so
  // without matching that `[dir]` prefix ourselves, Vuexy's built-in rule
  // silently beat ours on the default (non-hover) state even though this
  // stylesheet loads last in <head>. Their compiled CSS doesn't special-case
  // :hover the same way, which is why hover alone looked correct.
  return `:root {
  --bs-primary: ${hex} !important;
  --bs-primary-rgb: ${rgb} !important;
  --bs-link-color: ${hex} !important;
  --bs-link-color-rgb: ${rgb} !important;
  --bs-link-hover-color: ${hoverBg} !important;
}

/* The @veztraa/editor package (email signature / rich-text fields) has its
   own separate color system, unrelated to Bootstrap/Vuexy's - it defines
   these on ":root, [data-rte=light]" (and a [data-rte=dark] variant), so
   overriding only :root wouldn't reach an editor instance that sets these
   directly on its own wrapper element via [data-rte=light]. */
:root, [data-rte=light], [data-rte=dark] {
  --rte-active: ${hex} !important;
  --rte-active-text: ${contrastText} !important;
  --rte-accent: ${hex} !important;
  --rte-accent-h: ${hoverBg} !important;
  --rte-accent-dim: rgba(${rgb}, 0.1) !important;
  --rte-accent-ring: rgba(${rgb}, 0.3) !important;
  --rte-accent-light: ${tint(hex, 0.7)} !important;
  --rte-accent-r: ${hexToRgb(hex)[0]} !important;
  --rte-accent-g: ${hexToRgb(hex)[1]} !important;
  --rte-accent-b: ${hexToRgb(hex)[2]} !important;
  --rte-link: ${hex} !important;
  --rte-quote-border: ${hex} !important;
}

/* @veztraa/report-designer (PDF Designer) has its own color system too,
   defined on :root with its own default purple - same story as the
   editor package above. */
:root {
  --accent: ${hex} !important;
  --accent-h: ${hoverBg} !important;
}

/* The boot-time app loader (shown before any route/company data has
   loaded) hardcodes a slightly different purple shade
   (rgb(121, 97, 249)) than Vuexy's usual #7367f0, so the stylesheet
   sweep's exact-color match never touches it. */
[dir=ltr] .fallback-spinner .loading .effect-1,
[dir=ltr] .fallback-spinner .loading .effect-2,
[dir=ltr] .fallback-spinner .loading .effect-3 { border-left: 3px solid ${hex} !important; }
[dir=rtl] .fallback-spinner .loading .effect-1,
[dir=rtl] .fallback-spinner .loading .effect-2,
[dir=rtl] .fallback-spinner .loading .effect-3 { border-right: 3px solid ${hex} !important; }

/* :not(.active) so this never fights a component's own active-state
   styling on an <a> (list-group items, nav links, menu items...) - those
   set their own background + contrast text, and since this rule is
   !important it would otherwise always win regardless of specificity,
   even against a same-color background (invisible text). */
[dir] a:not(.active) { color: ${hex} !important; }
[dir] a:not(.active):hover { color: ${hoverBg} !important; }

[dir] .text-primary { color: ${hex} !important; }
[dir] .bg-primary { background-color: ${hex} !important; }
[dir] .border-primary { border-color: ${hex} !important; }

[dir] .btn-primary {
  --bs-btn-bg: ${hex} !important;
  --bs-btn-border-color: ${hex} !important;
  --bs-btn-hover-bg: ${hoverBg} !important;
  --bs-btn-hover-border-color: ${hoverBg} !important;
  --bs-btn-active-bg: ${activeBg} !important;
  --bs-btn-active-border-color: ${activeBg} !important;
  --bs-btn-disabled-bg: ${hex} !important;
  --bs-btn-disabled-border-color: ${hex} !important;
  --bs-btn-focus-shadow-rgb: ${rgb} !important;
  --bs-btn-color: ${contrastText} !important;
  --bs-btn-hover-color: ${contrastText} !important;
  --bs-btn-active-color: ${contrastText} !important;
  --bs-btn-disabled-color: ${contrastText} !important;
  background-color: ${hex} !important;
  border-color: ${hex} !important;
  color: ${contrastText} !important;
  box-shadow: 0 2px 4px 0 rgba(${rgb}, 0.4) !important;
}
[dir] .btn-primary:hover, [dir] .btn-primary:focus, [dir] .btn-primary:active {
  background-color: ${hoverBg} !important;
  border-color: ${hoverBg} !important;
  color: ${contrastText} !important;
  box-shadow: 0 4px 18px 0 rgba(${rgb}, 0.44) !important;
}

[dir] .btn-outline-primary {
  --bs-btn-color: ${hex} !important;
  --bs-btn-border-color: ${hex} !important;
  --bs-btn-hover-bg: ${hex} !important;
  --bs-btn-hover-border-color: ${hex} !important;
  --bs-btn-active-bg: ${hex} !important;
  --bs-btn-active-border-color: ${hex} !important;
  --bs-btn-focus-shadow-rgb: ${rgb} !important;
  color: ${hex} !important;
  border-color: ${hex} !important;
}
[dir] .btn-outline-primary:hover, [dir] .btn-outline-primary:active {
  background-color: ${hex} !important;
  border-color: ${hex} !important;
}

[dir] .btn-flat-primary { color: ${hex} !important; }
[dir] .btn-flat-primary:hover { background-color: rgba(${rgb}, 0.12) !important; }

[dir] .badge.bg-primary, [dir] .badge-primary { background-color: ${hex} !important; color: ${contrastText} !important; }
[dir] .badge.bg-light-primary { background-color: ${lightBg} !important; color: ${hex} !important; }

[dir] .alert-primary { color: ${hex} !important; background-color: ${lightBg} !important; border-color: ${borderSubtle} !important; }
[dir] .alert-primary .alert-link { color: ${shade(hex, 0.1)} !important; }

[dir] .progress-bar { background-color: ${hex} !important; }

[dir] .form-check-input:checked, [dir] .form-switch .form-check-input:checked {
  background-color: ${hex} !important;
  border-color: ${hex} !important;
}
[dir] .form-check-input:focus { box-shadow: 0 0 0 0.25rem rgba(${rgb}, 0.25) !important; }

[dir] .nav-pills .nav-link.active, [dir] .nav-pills .show > .nav-link { background-color: ${hex} !important; color: ${contrastText} !important; }
[dir] .page-item.active .page-link,
[dir] .pagination-primary .page-item.active .page-link { background-color: ${hex} !important; border-color: ${hex} !important; color: ${contrastText} !important; }

/* This exact spot (active menu item text) has twice lost to a
   same-specificity !important Vuexy rule that loads earlier - specificity
   ties among !important declarations go to source order, not to us just
   because we load last, so a plain tie isn't safe here. Inflating our own
   specificity with a repeated [dir] (a harmless no-op for matching -
   <html> either has a dir attribute or it doesn't, so [dir][dir] matches
   exactly what [dir] matches) guarantees we outrank anything Vuexy ships
   without needing to find and out-guess the exact competing selector. */
[dir][dir][dir] .main-menu .navigation li.active > a,
[dir][dir][dir] .main-menu .navigation li .active > a,
[dir][dir][dir] .main-menu .navigation li a.active {
  background: linear-gradient(118deg, rgba(${rgb}, 1), rgba(${rgb}, 0.7)) !important;
  box-shadow: 0 0 10px 1px rgba(${rgb}, 0.7) !important;
  color: ${contrastText} !important;
}
[dir][dir][dir] .main-menu .navigation li.active > a *,
[dir][dir][dir] .main-menu .navigation li .active > a *,
[dir][dir][dir] .main-menu .navigation li a.active * { color: ${contrastText} !important; }
[dir] .horizontal-menu .nav-link.active { color: ${hex} !important; }

[dir] .form-control:focus, [dir] .form-select:focus { border-color: ${focusBorder} !important; box-shadow: 0 0 0 0.2rem rgba(${rgb}, 0.25) !important; }

[dir] .dropdown-menu { --bs-dropdown-link-active-color: ${contrastText} !important; }
[dir][dir] .dropdown-item:hover, [dir][dir] .dropdown-item:focus {
  background-color: ${hex} !important;
  color: ${contrastText} !important;
}
[dir] .list-group { --bs-list-group-active-color: ${contrastText} !important; }

::selection { background: ${tint(hex, 0.5)}; }
`
}

const getStyleTag = () => {
  let tag = document.getElementById(STYLE_TAG_ID)
  if (!tag) {
    tag = document.createElement('style')
    tag.id = STYLE_TAG_ID
  }
  // Re-appending (even if already in <head>) moves it to the end, so it
  // stays last after any other stylesheet the app injects later.
  document.head.appendChild(tag)
  return tag
}

// Vuexy's own compiled CSS hardcodes the default primary color (#7367f0 /
// rgb(115, 103, 240), plus the same values URL-encoded inside inline SVG
// data-URIs) directly into hundreds of unrelated selectors - badges,
// avatars, dropdowns, pagination, the date picker, dropzones, editor
// toolbars, and more. Rather than hand-maintain a selector list that will
// always be one screenshot behind, this scans every stylesheet actually
// loaded by the app, finds any rule that hardcodes that default color, and
// clones it verbatim into our override with the color swapped - so it
// automatically matches the original's exact selector (same or higher
// specificity is guaranteed since it's a literal clone) and, appended last,
// wins any remaining tie.
const DEFAULT_HEX_RE = /#7367f0/gi
const DEFAULT_RGB_RE = /115\s*,\s*103\s*,\s*240/gi
const DEFAULT_ENCODED_HEX_RE = /%237367f0/gi

const buildStylesheetSweepCSS = hex => {
  const rgbTuple = hexToRgb(hex).join(', ')
  const encodedHex = '%23' + hex.slice(1)
  let out = ''

  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.ownerNode && sheet.ownerNode.id === STYLE_TAG_ID) continue
    let rules
    try {
      rules = sheet.cssRules
    } catch (e) {
      continue // cross-origin sheet we can't read, or not parsed yet
    }
    if (!rules) continue
    for (const rule of Array.from(rules)) {
      const text = rule.cssText
      if (!text) continue
      DEFAULT_HEX_RE.lastIndex = 0
      DEFAULT_RGB_RE.lastIndex = 0
      DEFAULT_ENCODED_HEX_RE.lastIndex = 0
      if (!DEFAULT_HEX_RE.test(text) && !DEFAULT_RGB_RE.test(text) && !DEFAULT_ENCODED_HEX_RE.test(text)) continue
      out += text
        .replace(DEFAULT_HEX_RE, hex)
        .replace(DEFAULT_RGB_RE, rgbTuple)
        .replace(DEFAULT_ENCODED_HEX_RE, encodedHex)
      out += '\n'
    }
  }
  return out
}

let lastAppliedHex = null
let sweepObserverStarted = false

// Route chunks (e.g. the file-upload dropzone) and their CSS load lazily,
// well after the initial sweep runs. Watch for any new <link>/<style> the
// app adds to <head> and re-sweep once it's actually loaded, so a page
// visited later in the session still gets themed correctly.
const startThemeColorAutoSweep = () => {
  if (sweepObserverStarted || typeof MutationObserver === 'undefined') return
  sweepObserverStarted = true
  const rerun = () => {
    if (lastAppliedHex) applyThemeColor(lastAppliedHex)
  }
  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'LINK' && node.rel === 'stylesheet') {
          node.addEventListener('load', rerun, { once: true })
        } else if (node.nodeName === 'STYLE' && node.id !== STYLE_TAG_ID) {
          rerun()
        }
      }
    }
  }).observe(document.head, { childList: true })
}

export const applyThemeColor = hex => {
  if (!isValidHexColor(hex)) return
  lastAppliedHex = hex
  getStyleTag().textContent = buildThemeColorCSS(hex) + '\n' + buildStylesheetSweepCSS(hex)
  startThemeColorAutoSweep()
  // A stylesheet already in <head> but still mid-download won't have
  // parsed cssRules yet on the first pass above - catch it once the page
  // finishes loading.
  if (document.readyState !== 'complete') {
    window.addEventListener('load', rerunSweepOnLoad, { once: true })
  }
}

function rerunSweepOnLoad() {
  if (lastAppliedHex) applyThemeColor(lastAppliedHex)
}

export const getCachedThemeColor = () => {
  try {
    const cached = localStorage.getItem(THEME_COLOR_STORAGE_KEY)
    return isValidHexColor(cached) ? cached : DEFAULT_THEME_COLOR
  } catch (e) {
    return DEFAULT_THEME_COLOR
  }
}

export const setCachedThemeColor = hex => {
  try {
    if (isValidHexColor(hex)) localStorage.setItem(THEME_COLOR_STORAGE_KEY, hex)
  } catch (e) {
    // localStorage unavailable (private mode, etc.) - color still applies for this page view
  }
}
