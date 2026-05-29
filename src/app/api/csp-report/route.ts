import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Receives Content Security Policy violation reports sent by browsers via the
 * `report-uri` directive. Reports are logged to stderr so they appear in
 * production log aggregation (e.g. Vercel logs, Datadog).
 *
 * The endpoint accepts both the legacy `application/csp-report` format
 * (JSON object wrapped in `{ "csp-report": {...} }`) and the newer
 * `application/reports+json` format (array of report objects).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Log at error level so it surfaces in production alerting pipelines.
    console.error('[CSP Violation]', JSON.stringify(body))
  } catch {
    // Malformed or empty report body — ignore
  }

  // Return 204 — browsers don't need a response body for report submissions.
  return new NextResponse(null, { status: 204 })
}
