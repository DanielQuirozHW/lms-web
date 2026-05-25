// Minimal surface type — we only call .sanitize().
type Sanitizer = { sanitize: (html: string) => string }

// Lazy-loaded on the client; null on the server (no DOM available).
let _purify: Sanitizer | null = null

function getPurify(): Sanitizer | null {
  if (typeof window === 'undefined') return null
  if (!_purify) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _purify = require('dompurify') as Sanitizer
  }
  return _purify
}

/**
 * Sanitizes an HTML string with DOMPurify on the client.
 * On the server (SSR), returns the string unchanged — rendering should be
 * deferred to the client or the caller should avoid dangerouslySetInnerHTML.
 */
export function sanitize(html: string): string {
  const purify = getPurify()
  return purify ? purify.sanitize(html) : html
}
