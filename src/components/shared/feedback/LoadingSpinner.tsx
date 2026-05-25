import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingSpinnerProps {
  className?: string
  rows?: number
}

export function LoadingSpinner({ className, rows = 3 }: LoadingSpinnerProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function PageSpinner() {
  return (
    <div
      className="flex min-h-[400px] items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="border-muted border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    </div>
  )
}
