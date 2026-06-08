'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateProgress } from '@/hooks/mutations/lessons'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SPEEDS = [0.5, 1, 1.25, 1.5, 2] as const
type Speed = (typeof SPEEDS)[number]

const PROGRESS_INTERVAL_MS = 10_000
const COMPLETION_THRESHOLD = 0.9

interface VideoPlayerProps {
  videoUrl: string
  courseId: string
  moduleId: string
  lessonId: string
  nextLessonHref?: string | null
  initialWatchedSeconds?: number
  isAlreadyCompleted?: boolean
  onComplete?: () => void
}

export function VideoPlayer({
  videoUrl,
  courseId,
  moduleId,
  lessonId,
  nextLessonHref,
  initialWatchedSeconds = 0,
  isAlreadyCompleted = false,
  onComplete,
}: VideoPlayerProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const completionCalledRef = useRef(isAlreadyCompleted)
  const [isBuffering, setIsBuffering] = useState(true)
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted)
  const [playbackRate, setPlaybackRate] = useState<Speed>(1)
  const { mutate } = useUpdateProgress(courseId, moduleId, lessonId)

  // Seek to previous position on load
  function handleLoadedData() {
    setIsBuffering(false)
    const video = videoRef.current
    if (!video) return
    if (initialWatchedSeconds > 0) {
      video.currentTime = Math.min(initialWatchedSeconds, video.duration)
    }
  }

  // Check for completion on each time update
  function handleTimeUpdate() {
    const video = videoRef.current
    if (!video || completionCalledRef.current || !video.duration) return

    if (video.currentTime / video.duration >= COMPLETION_THRESHOLD) {
      completionCalledRef.current = true
      mutate(
        { completed: true },
        {
          onSuccess: () => {
            setIsCompleted(true)
            onComplete?.()
            toast.success('✓ Lección completada')
            router.refresh()
          },
        }
      )
    }
  }

  // Save watchedSeconds every PROGRESS_INTERVAL_MS while playing
  const saveProgress = useCallback(() => {
    const video = videoRef.current
    if (!video || video.paused || video.ended) return
    mutate({ watchedSeconds: Math.floor(video.currentTime) })
  }, [mutate])

  useEffect(() => {
    const timer = setInterval(saveProgress, PROGRESS_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [saveProgress])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return

      const video = videoRef.current
      if (!video) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (video.paused) {
            void video.play()
          } else {
            video.pause()
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'ArrowRight':
          e.preventDefault()
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10)
          break
        case 'KeyM':
          video.muted = !video.muted
          break
        case 'KeyF':
          if (document.fullscreenElement) {
            void document.exitFullscreen()
          } else {
            void containerRef.current?.requestFullscreen()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleSpeedChange(speed: Speed) {
    setPlaybackRate(speed)
    if (videoRef.current) videoRef.current.playbackRate = speed
  }

  return (
    <div className="space-y-2">
      {/* Video container */}
      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="h-full w-full"
          onLoadedData={handleLoadedData}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
        >
          Tu navegador no soporta la reproducción de video.
        </video>

        {/* Buffering overlay */}
        {isBuffering && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40"
            aria-label="Cargando video..."
          >
            <Loader2 className="h-10 w-10 animate-spin text-white" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Playback speed selector */}
      <div
        className="flex items-center gap-1.5"
        role="group"
        aria-label="Velocidad de reproducción"
      >
        <span className="text-nexus-muted text-xs">Velocidad:</span>
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            onClick={() => handleSpeedChange(speed)}
            className={cn(
              'rounded px-2 py-0.5 text-xs font-medium transition-colors',
              speed === playbackRate
                ? 'bg-nexus-accent text-white'
                : 'text-nexus-muted hover:text-nexus-text hover:bg-nexus-card'
            )}
            aria-pressed={speed === playbackRate}
          >
            {speed}×
          </button>
        ))}
      </div>

      {/* Keyboard hint */}
      <p className="text-nexus-muted text-[10px]">
        Atajos: Espacio (pausa), ← → (±10s), M (mute), F (pantalla completa)
      </p>

      {!isCompleted && (
        <p className="text-nexus-muted text-xs">
          Mirá el video completo para marcar esta lección como completada
        </p>
      )}
      {isCompleted && nextLessonHref && (
        <Link
          href={nextLessonHref}
          className={buttonVariants({
            className: 'bg-nexus-accent hover:bg-nexus-accent-hover text-white',
          })}
        >
          Siguiente lección
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
