import type { NextConfig } from 'next'

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

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin} ${wsOrigin}`,
    "frame-ancestors 'none'",
  ].join('; ')
}

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
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
