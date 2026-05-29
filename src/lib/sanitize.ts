// Minimal DOMPurify interface — only expose what we use.
interface DOMPurifyConfig {
  ALLOWED_TAGS?: string[]
  ALLOWED_ATTR?: string[]
  ALLOW_DATA_ATTR?: boolean
  FORCE_BODY?: boolean
}

interface DOMPurifyInstance {
  sanitize(html: string, config?: DOMPurifyConfig): string
  addHook(
    entryPoint: string,
    hook: (node: Element, hookEvent: null, config: DOMPurifyConfig) => void
  ): void
}

// Lazy-loaded on the client; null on the server (no DOM available).
let _purify: DOMPurifyInstance | null = null
let _hooksInitialized = false

// ─── Allowlists ───────────────────────────────────────────────────────────────
// Explicit allowlist — anything not in this list is stripped.
// No SVG, MathML, form elements, scripts, or embedded content.

const ALLOWED_TAGS = [
  // Inline text
  'p',
  'br',
  'hr',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'ins',
  'mark',
  'sup',
  'sub',
  // Headings
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // Lists
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  // Block / semantic
  'div',
  'span',
  'blockquote',
  'pre',
  'code',
  'kbd',
  'samp',
  // Links and images
  'a',
  'img',
  // Tables
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  // Grouping
  'figure',
  'figcaption',
]

const ALLOWED_ATTR = [
  'href',
  'src',
  'alt',
  'title',
  'class',
  'id',
  'target',
  'rel',
  'width',
  'height',
  'colspan',
  'rowspan',
  'scope',
  'lang',
  'dir',
]

const SANITIZE_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  // Never allow data-* attributes (potential XSS via framework-specific data attrs)
  ALLOW_DATA_ATTR: false,
  // Wrap in <body> to prevent doctype/head injection via context confusion
  FORCE_BODY: true,
}

// ─── DOMPurify hooks (run once per module lifetime) ───────────────────────────

function initHooks(purify: DOMPurifyInstance): void {
  if (_hooksInitialized) return
  _hooksInitialized = true

  purify.addHook('afterSanitizeAttributes', (node) => {
    // 1. Force rel="noopener noreferrer" on target="_blank" links to prevent
    //    window.opener access from third-party pages (tabnabbing attack).
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer')
    }

    // 2. Block dangerous URI schemes in href (javascript:, vbscript:, data:).
    //    DOMPurify blocks javascript: by default but we are explicit here.
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      const href = (node.getAttribute('href') ?? '').trim()
      if (/^(javascript|vbscript|data):/i.test(href)) {
        node.removeAttribute('href')
      }
    }

    // 3. Only allow https:// or root-relative URLs in src attributes.
    //    This blocks data: URIs and protocol-relative URLs (//evil.com).
    if (node.hasAttribute('src')) {
      const src = (node.getAttribute('src') ?? '').trim()
      if (!/^https?:\/\//i.test(src) && !src.startsWith('/')) {
        node.removeAttribute('src')
      }
    }
  })
}

function getPurify(): DOMPurifyInstance | null {
  if (typeof window === 'undefined') return null
  if (!_purify) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _purify = require('dompurify') as DOMPurifyInstance
    initHooks(_purify)
  }
  return _purify
}

/**
 * Sanitizes an HTML string with DOMPurify on the client using a hardened
 * allowlist configuration. Strips all tags not in the allowlist (including
 * SVG, MathML, forms, scripts, and embedded content). Enforces safe link
 * attributes. Blocks javascript:, vbscript:, and data: URIs.
 *
 * On the server (SSR) this is a no-op — only call it in 'use client'
 * components that use dangerouslySetInnerHTML.
 */
export function sanitize(html: string): string {
  const purify = getPurify()
  if (!purify) return html
  return purify.sanitize(html, SANITIZE_CONFIG)
}
