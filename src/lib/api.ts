import axios, { type AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// Attach Bearer token on every request.
// On the client, reads from the Auth.js session via a route handler.
// The raw token is never stored in JS — it flows through the session cookie.
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/auth/token')
      if (res.ok) {
        const { accessToken } = (await res.json()) as { accessToken: string }
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    } catch {
      // Not signed in — request proceeds without auth header
    }
  }
  return config
})

let isRefreshing = false
let refreshSubscribers: Array<{
  onDone: (token: string) => void
  onFail: (err: unknown) => void
}> = []

function subscribeRefresh(onDone: (token: string) => void, onFail: (err: unknown) => void) {
  refreshSubscribers.push({ onDone, onFail })
}

function onRefreshDone(token: string) {
  refreshSubscribers.forEach(({ onDone }) => onDone(token))
  refreshSubscribers = []
}

function onRefreshFailed(err: unknown) {
  refreshSubscribers.forEach(({ onFail }) => onFail(err))
  refreshSubscribers = []
}

// ─── Multi-tab token refresh coordination ────────────────────────────────────
// When one tab is refreshing, other tabs queue their requests instead of each
// starting their own refresh (which would invalidate the first tab's new token
// because the backend rotates refresh tokens on use).

interface RefreshCoordMsg {
  type: 'REFRESHING' | 'REFRESH_DONE' | 'REFRESH_FAILED'
  accessToken?: string
}

let authChannel: BroadcastChannel | null = null

function getAuthChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null
  if (authChannel) return authChannel

  try {
    authChannel = new BroadcastChannel('nexus-auth-refresh')

    authChannel.onmessage = (event: MessageEvent<RefreshCoordMsg>) => {
      const { data } = event
      if (data.type === 'REFRESHING') {
        // Another tab started refreshing — activate queue mode in THIS tab
        // so any 401s here queue up rather than starting a second refresh.
        isRefreshing = true
      } else if (data.type === 'REFRESH_DONE' && data.accessToken) {
        // Another tab completed the refresh successfully — drain our queue.
        isRefreshing = false
        onRefreshDone(data.accessToken)
      } else if (data.type === 'REFRESH_FAILED') {
        // Another tab failed the refresh — log out this tab too.
        isRefreshing = false
        onRefreshFailed(new Error('Token refresh failed in another tab'))
        void (async () => {
          try {
            const { signOut } = await import('next-auth/react')
            await signOut({ callbackUrl: '/login' })
          } catch {
            window.location.href = '/login'
          }
        })()
      }
    }
  } catch {
    // BroadcastChannel not supported (very old browser) — fall back to
    // per-tab refresh behaviour (original code path).
    authChannel = null
  }

  return authChannel
}

// Initialise channel lazily once the browser is available.
if (typeof window !== 'undefined') {
  getAuthChannel()
}

// ─── Response interceptor ─────────────────────────────────────────────────────

// Unwrap the backend { data, timestamp } envelope so callers receive the
// payload directly. Skipped for 204 (no body) and non-object bodies.
api.interceptors.response.use(
  (response) => {
    if (
      response.status !== 204 &&
      response.data !== null &&
      typeof response.data === 'object' &&
      'data' in response.data
    ) {
      response.data = (response.data as { data: unknown }).data
    }
    return response
  },
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeRefresh((token) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          }, reject)
        })
      }
      original._retry = true
      isRefreshing = true

      // Inform other tabs that this tab is now refreshing.
      getAuthChannel()?.postMessage({ type: 'REFRESHING' } satisfies RefreshCoordMsg)

      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' })
        if (!res.ok) throw new Error('Refresh failed')
        const { accessToken } = (await res.json()) as { accessToken: string }
        if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`
        onRefreshDone(accessToken)

        // Broadcast the new token so other tabs can drain their queues.
        getAuthChannel()?.postMessage({
          type: 'REFRESH_DONE',
          accessToken,
        } satisfies RefreshCoordMsg)

        return api(original)
      } catch {
        // Refresh failed — reject all queued requests then sign the user out.
        onRefreshFailed(error)

        // Inform other tabs so they also sign out.
        getAuthChannel()?.postMessage({ type: 'REFRESH_FAILED' } satisfies RefreshCoordMsg)

        if (typeof window !== 'undefined') {
          try {
            const { signOut } = await import('next-auth/react')
            await signOut({ callbackUrl: '/login' })
          } catch {
            // signOut() itself failed — force a hard redirect as fallback so
            // the user is never left in a broken authenticated state.
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error) && error.response?.data != null
}

export default api
