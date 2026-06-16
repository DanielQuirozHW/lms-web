import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'nexus_last_activity'
const INACTIVITY_LIMIT_MS = 60 * 60 * 1000 // 60 minutes
const WARNING_THRESHOLD_MS = 55 * 60 * 1000 // 55 minutes — show warning modal
const CHECK_INTERVAL_MS = 30 * 1000 // check every 30 seconds
const WRITE_THROTTLE_MS = 10 * 1000 // max one localStorage write per 10 seconds

interface UseSessionTimeoutOptions {
  enabled: boolean
  onTimeout: () => void
}

interface UseSessionTimeoutResult {
  showWarning: boolean
  minutesRemaining: number
  keepAlive: () => void
}

export function useSessionTimeout({
  enabled,
  onTimeout,
}: UseSessionTimeoutOptions): UseSessionTimeoutResult {
  const [showWarning, setShowWarning] = useState(false)
  const [minutesRemaining, setMinutesRemaining] = useState(5)
  const lastWriteRef = useRef(0)
  // Keep ref in sync with the latest prop. Written in an effect (not during render)
  // to satisfy react-hooks/refs; the interval only calls it asynchronously so the
  // one-render delay before the first sync is harmless.
  const onTimeoutRef = useRef(onTimeout)
  useEffect(() => {
    onTimeoutRef.current = onTimeout
  })

  const keepAlive = useCallback(() => {
    const now = Date.now()
    localStorage.setItem(STORAGE_KEY, String(now))
    lastWriteRef.current = now
    setShowWarning(false)
  }, [])

  useEffect(() => {
    if (!enabled) return

    function recordActivity() {
      const now = Date.now()
      // Throttle: write at most once per WRITE_THROTTLE_MS to avoid flooding localStorage
      // on high-frequency events like mousemove
      if (now - lastWriteRef.current >= WRITE_THROTTLE_MS) {
        localStorage.setItem(STORAGE_KEY, String(now))
        lastWriteRef.current = now
      }
    }

    function checkInactivity() {
      const raw = localStorage.getItem(STORAGE_KEY)
      // Treat missing key as just-now active (first-ever mount)
      const lastActivity = raw ? parseInt(raw, 10) : Date.now()
      const elapsed = Date.now() - lastActivity

      if (elapsed >= INACTIVITY_LIMIT_MS) {
        onTimeoutRef.current()
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        const mins = Math.max(1, Math.ceil((INACTIVITY_LIMIT_MS - elapsed) / 60_000))
        setMinutesRemaining(mins)
        setShowWarning(true)
      } else {
        setShowWarning(false)
      }
    }

    // Initialise timestamp on first mount so subsequent checks have a baseline
    if (!localStorage.getItem(STORAGE_KEY)) {
      const now = Date.now()
      localStorage.setItem(STORAGE_KEY, String(now))
      lastWriteRef.current = now
    }

    // Immediate check — handles the closed-tab / machine-suspend case where the
    // user reopens a tab after > 60 minutes of real-world inactivity
    checkInactivity()

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, recordActivity, { passive: true }))
    const interval = setInterval(checkInactivity, CHECK_INTERVAL_MS)

    return () => {
      events.forEach((e) => window.removeEventListener(e, recordActivity))
      clearInterval(interval)
    }
  }, [enabled]) // only re-runs if enabled changes; onTimeout is accessed via stable ref

  return { showWarning, minutesRemaining, keepAlive }
}
