import { useMutation } from '@tanstack/react-query'
import { signIn, signOut } from 'next-auth/react'
import api from '@/lib/api'

interface LoginInput {
  email: string
  password: string
}

interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async ({ email, password }: LoginInput) => {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        throw new Error('Invalid email or password')
      }
      return result
    },
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      await api.post('/auth/register', data)
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        throw new Error('Registration succeeded but sign-in failed. Please log in manually.')
      }
      return result
    },
  })
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {
        // Backend revocation failed — clear local session regardless
      }
      await signOut({ callbackUrl: '/login' })
    },
  })
}
