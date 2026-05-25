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
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshDone(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

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
        return new Promise((resolve) => {
          subscribeRefresh((token) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' })
        if (!res.ok) throw new Error('Refresh failed')
        const { accessToken } = (await res.json()) as { accessToken: string }
        if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`
        onRefreshDone(accessToken)
        return api(original)
      } catch {
        // Refresh failed — sign the user out
        refreshSubscribers = []
        if (typeof window !== 'undefined') {
          const { signOut } = await import('next-auth/react')
          await signOut({ callbackUrl: '/login' })
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
