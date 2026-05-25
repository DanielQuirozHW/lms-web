'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/shared/feedback/EmptyState'

export default function NotFound() {
  const router = useRouter()
  return (
    <EmptyState
      icon={Search}
      title="Page not found"
      description="The page you are looking for does not exist."
      action={{ label: 'Go home', onClick: () => router.push('/') }}
    />
  )
}
