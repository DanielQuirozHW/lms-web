import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type EmptyStateAction =
  | {
      label: string
      onClick: () => void
      href?: never
      variant?: 'default' | 'outline' | 'secondary'
    }
  | { label: string; href: string; onClick?: never; variant?: 'default' | 'outline' | 'secondary' }

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
        'flex min-h-75 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10 text-center',
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
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className={buttonVariants({ variant: action.variant ?? 'default' })}
          >
            {action.label}
          </Link>
        ) : (
          <Button variant={action.variant ?? 'default'} onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  )
}
