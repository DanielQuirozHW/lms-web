import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | NexusLMS',
    default: 'NexusLMS',
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
