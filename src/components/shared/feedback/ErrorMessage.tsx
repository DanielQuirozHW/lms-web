import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <Card className={cn('border-destructive/30 bg-destructive/5', className)}>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <AlertCircle className="text-destructive h-10 w-10" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
