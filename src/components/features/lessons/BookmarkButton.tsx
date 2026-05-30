'use client'

import { Bookmark, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBookmarkCheck } from '@/hooks/queries/bookmarks'
import { useToggleBookmark } from '@/hooks/mutations/bookmarks'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface BookmarkButtonProps {
  lessonId: string
}

export function BookmarkButton({ lessonId }: BookmarkButtonProps) {
  const { data: check, isLoading } = useBookmarkCheck(lessonId)
  const { mutate: toggle, isPending } = useToggleBookmark(lessonId)

  const isBookmarked = check?.isBookmarked ?? false
  const label = isBookmarked ? 'Lección guardada' : 'Guardar lección'

  function handleClick() {
    if (isPending || isLoading) return
    toggle(isBookmarked)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={handleClick}
              disabled={isPending || isLoading}
              aria-label={label}
              aria-pressed={isBookmarked}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                'focus:ring-nexus-accent/50 focus:ring-2 focus:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isBookmarked
                  ? 'border-nexus-accent bg-nexus-accent/15 text-nexus-accent hover:bg-nexus-accent/25'
                  : 'border-nexus-border bg-nexus-card text-nexus-muted hover:border-nexus-accent hover:text-nexus-accent'
              )}
            />
          }
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Bookmark
              className="h-4 w-4"
              aria-hidden="true"
              fill={isBookmarked ? 'currentColor' : 'none'}
            />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
