import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Verify Email' }

export default function VerifyEmailPage() {
  return (
    <div className="bg-background w-full max-w-sm space-y-6 rounded-lg p-8 shadow">
      <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
      {/* VerifyEmailForm will go here */}
    </div>
  )
}
