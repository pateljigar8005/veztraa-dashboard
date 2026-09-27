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

  // Every rule below uses !important. This override is deliberately not
  // relying on cascade order (being "last in <head>") because Vite's dev
  // server can re-inject/reorder the app's own CSS via HMR after this tag
  // exists, which would otherwise silently lose the override mid-session.
  return `:root {
  --bs-primary: ${hex} !important;
  --bs-primary-rgb: ${rgb} !important;
  --bs-link-color: ${hex} !important;
  --bs-link-color-rgb: ${rgb} !important;
  --bs-link-hover-color: ${hoverBg} !important;
}

a { color: ${hex} !important; }
a:hover { color: ${hoverBg} !important; }

.text-primary { color: ${hex} !important; }
.bg-primary { background-color: ${hex} !important; }
.border-primary { border-color: ${hex} !important; }

.btn-primary {
  --bs-btn-bg: ${hex} !important;
  --bs-btn-border-color: ${hex} !important;
  --bs-btn-hover-bg: ${hoverBg} !important;
  --bs-btn-hover-border-color: ${hoverBg} !important;
  --bs-btn-active-bg: ${activeBg} !important;
  --bs-btn-active-border-color: ${activeBg} !important;
  --bs-btn-disabled-bg: ${hex} !important;
  --bs-btn-disabled-border-color: ${hex} !important;
  --bs-btn-focus-shadow-rgb: ${rgb} !important;
  background-color: ${hex} !important;
  border-color: ${hex} !important;
  box-shadow: 0 2px 4px 0 rgba(${rgb}, 0.4) !important;
}
.btn-primary:hover, .btn-primary:focus, .btn-primary:active {
  background-color: ${hoverBg} !important;
  border-color: ${hoverBg} !important;
  box-shadow: 0 4px 18px 0 rgba(${rgb}, 0.44) !important;
}

.btn-outline-primary {
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
.btn-outline-primary:hover, .btn-outline-primary:active {
  background-color: ${hex} !important;
  border-color: ${hex} !important;
}

.btn-flat-primary { color: ${hex} !important; }
.btn-flat-primary:hover { background-color: rgba(${rgb}, 0.12) !important; }

.badge.bg-primary, .badge-primary { background-color: ${hex} !important; }
.badge.bg-light-primary { background-color: ${lightBg} !important; color: ${hex} !important; }

.alert-primary { color: ${hex} !important; background-color: ${lightBg} !important; border-color: ${borderSubtle} !important; }
.alert-primary .alert-link { color: ${shade(hex, 0.1)} !important; }

.progress-bar { background-color: ${hex} !important; }

.form-check-input:checked, .form-switch .form-check-input:checked {
  background-color: ${hex} !important;
  border-color: ${hex} !important;
}
.form-check-input:focus { box-shadow: 0 0 0 0.25rem rgba(${rgb}, 0.25) !important; }

.nav-pills .nav-link.active, .nav-pills .show > .nav-link { background-color: ${hex} !important; }
.page-item.active .page-link { background-color: ${hex} !important; border-color: ${hex} !important; }

.main-menu .navigation li.active > a {
  background: linear-gradient(118deg, rgba(${rgb}, 1), rgba(${rgb}, 0.7)) !important;
  box-shadow: 0 0 10px 1px rgba(${rgb}, 0.7) !important;
  color: #fff !important;
}
.main-menu .navigation li.active > a * { color: #fff !important; }
.main-menu .navigation li .active > a { color: ${hex} !important; }
.horizontal-menu .nav-link.active { color: ${hex} !important; }

.form-control:focus, .form-select:focus { border-color: ${focusBorder} !important; box-shadow: 0 0 0 0.2rem rgba(${rgb}, 0.25) !important; }

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

export const applyThemeColor = hex => {
  if (!isValidHexColor(hex)) return
  getStyleTag().textContent = buildThemeColorCSS(hex)
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
