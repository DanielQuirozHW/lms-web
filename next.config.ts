import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

function buildCsp(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000'

  let apiOrigin = 'http://localhost:3000'
  try {
    apiOrigin = new URL(apiUrl).origin
  } catch {
    // keep default
  }

  let wsOrigin = 'ws://localhost:3000'
  try {
    const parsed = new URL(wsUrl)
    wsOrigin = `${parsed.protocol === 'https:' ? 'wss' : 'ws'}://${parsed.host}`
  } catch {
    // keep default
  }

  // unsafe-eval is needed only by Next.js HMR in development.
  // Never include it in production — it defeats XSS mitigations.
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline'"

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin} ${wsOrigin}${isDev ? ' ws://127.0.0.1:* http://127.0.0.1:*' : ''}`,
    "frame-ancestors 'none'",
    // Violations are POSTed to /api/csp-report for monitoring.
    'report-uri /api/csp-report',
  ].join('; ')
}

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // DENY matches the CSP frame-ancestors 'none' directive above.
  // SAMEORIGIN would conflict — browsers may enforce whichever is more permissive.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: buildCsp(),
  },
  // HSTS: only set in production — local dev uses http and would break.
  ...(isDev
    ? []
    : [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]),
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 CDN — update with actual R2 public URL in production
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
