import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create Account' }

export default function RegisterPage() {
  return (
    <div className="bg-background w-full max-w-sm space-y-6 rounded-lg p-8 shadow">
      <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
      {/* RegisterForm will go here */}
    </div>
  )
}
