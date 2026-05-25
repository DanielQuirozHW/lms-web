import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile' }

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
      {/* ProfileForm will go here */}
    </div>
  )
}
