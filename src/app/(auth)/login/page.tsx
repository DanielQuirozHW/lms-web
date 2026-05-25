import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="bg-background w-full max-w-sm space-y-6 rounded-lg p-8 shadow">
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      {/* LoginForm will go here */}
    </div>
  )
}
