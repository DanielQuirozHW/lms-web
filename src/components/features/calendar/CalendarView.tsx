'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'

import { useCalendarEvents } from '@/hooks/queries/calendar'
import { useCreateCalendarEvent } from '@/hooks/mutations/calendar'
import type { CalendarEvent, CalendarEventType } from '@/types/models'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/errors'

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const EVENT_COLORS: Record<CalendarEventType, string> = {
  COURSE_START: 'bg-blue-500 text-white hover:bg-blue-600',
  COURSE_END: 'bg-green-500 text-white hover:bg-green-600',
  ASSIGNMENT_DUE: 'bg-orange-500 text-white hover:bg-orange-600',
  QUIZ_DUE: 'bg-yellow-500 text-white hover:bg-yellow-600',
  LESSON_AVAILABLE: 'bg-slate-400 text-white hover:bg-slate-500',
  CUSTOM: 'bg-purple-500 text-white hover:bg-purple-600',
}

const EVENT_LABELS: Record<CalendarEventType, string> = {
  COURSE_START: 'Inicio de curso',
  COURSE_END: 'Fin de curso',
  ASSIGNMENT_DUE: 'Entrega de tarea',
  QUIZ_DUE: 'Quiz',
  LESSON_AVAILABLE: 'Lección disponible',
  CUSTOM: 'Evento personalizado',
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateES(dateStr: string): string {
  const raw = dateStr.split('T')[0]
  const [year, month, day] = raw.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getCalendarWeeks(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7 // convert Sun=0 to Mon=0

  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// ─── Form schema ──────────────────────────────────────────────────────────────

const createEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  startDate: z.string().min(1, 'La fecha es requerida'),
  allDay: z.boolean(),
})

type CreateEventValues = z.infer<typeof createEventSchema>

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarView() {
  const todayKey = useMemo(() => toDateKey(new Date()), [])
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const startDate = useMemo(() => {
    const y = currentDate.getFullYear()
    const m = String(currentDate.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  }, [currentDate])

  const endDate = useMemo(
    () => toDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)),
    [currentDate]
  )

  const { data, isLoading } = useCalendarEvents(startDate, endDate)

  const { mutate: createEvent, isPending } = useCreateCalendarEvent()

  const form = useForm<CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { title: '', startDate: todayKey, allDay: true },
  })

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of data?.data ?? []) {
      const key = event.startDate.split('T')[0]
      map.set(key, [...(map.get(key) ?? []), event])
    }
    return map
  }, [data])

  const weeks = useMemo(
    () => getCalendarWeeks(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  )

  function prevMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  function goToToday() {
    setCurrentDate(new Date())
  }

  function handleCreateOpenChange(open: boolean) {
    if (!open) form.reset({ title: '', startDate: todayKey, allDay: true })
    setCreateOpen(open)
  }

  function onSubmit(values: CreateEventValues) {
    createEvent(
      { title: values.title, type: 'CUSTOM', startDate: values.startDate, allDay: values.allDay },
      {
        onSuccess: () => {
          toast.success('Evento creado')
          handleCreateOpenChange(false)
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, 'No se pudo crear el evento'))
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="w-52 text-center text-lg font-semibold">
            {MONTHS_ES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border">
        {/* Day headers */}
        <div className="bg-muted/50 grid grid-cols-7 border-b">
          {DAYS_ES.map((day) => (
            <div
              key={day}
              className="text-muted-foreground py-2 text-center text-xs font-medium tracking-wide uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks — skeleton while loading */}
        {isLoading
          ? Array.from({ length: 5 }).map((_, wi) => (
              <div key={wi} className={cn('grid grid-cols-7', wi > 0 && 'border-t')}>
                {Array.from({ length: 7 }).map((_, di) => (
                  <div key={di} className={cn('min-h-24 p-2', di > 0 && 'border-l')}>
                    <Skeleton className="mb-2 h-5 w-5 rounded-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ))
          : weeks.map((week, wi) => (
              <div key={wi} className={cn('grid grid-cols-7', wi > 0 && 'border-t')}>
                {week.map((cell, di) => {
                  const dateKey = cell ? toDateKey(cell) : null
                  const isToday = dateKey === todayKey
                  const dayEvents = dateKey ? (eventsByDay.get(dateKey) ?? []) : []

                  return (
                    <div
                      key={di}
                      className={cn('min-h-24 p-1', di > 0 && 'border-l', !cell && 'bg-muted/20')}
                    >
                      {cell && (
                        <>
                          <span
                            className={cn(
                              'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                              isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                            )}
                          >
                            {cell.getDate()}
                          </span>
                          <div className="space-y-0.5">
                            {dayEvents.map((event) => (
                              <button
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={cn(
                                  'w-full truncate rounded px-1.5 py-0.5 text-left text-xs transition-colors',
                                  EVENT_COLORS[event.type]
                                )}
                              >
                                {event.title}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
      </div>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-sm">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <p className="text-muted-foreground text-sm capitalize">
                  {formatDateES(selectedEvent.startDate)}
                </p>
                <Badge variant="secondary">{EVENT_LABELS[selectedEvent.type]}</Badge>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create event dialog */}
      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo evento</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del evento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allDay"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="mb-0 cursor-pointer font-normal">Todo el día</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
              )}
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCreateOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creando...' : 'Crear evento'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
