import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'secondary'
}

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10 text-center',
        className
      )}
    >
      {Icon && (
        <div className="bg-muted rounded-full p-4">
          <Icon className="text-muted-foreground h-8 w-8" aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-base font-semibold">{title}</p>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {action && (
        <Button variant={action.variant ?? 'default'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
