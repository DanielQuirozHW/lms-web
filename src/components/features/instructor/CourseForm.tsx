'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ImagePlus, Loader2, Info, Users, UserCheck, Key, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCreateCourse, useUpdateCourse, useUploadCourseCover } from '@/hooks/mutations/courses'
import type { Course, Category, EnrollmentType } from '@/types/models'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  enrollmentType: z.enum(['FREE', 'ASSIGNED', 'CODE', 'PAID']),
  price: z.number().nonnegative('El precio debe ser un número positivo').optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Enrollment type options ──────────────────────────────────────────────────

const ENROLLMENT_OPTIONS: {
  value: EnrollmentType
  label: string
  description: string
  icon: React.ElementType
}[] = [
  {
    value: 'FREE',
    label: 'Libre',
    description: 'Cualquiera puede inscribirse',
    icon: Users,
  },
  {
    value: 'ASSIGNED',
    label: 'Asignado',
    description: 'Solo por administrador',
    icon: UserCheck,
  },
  {
    value: 'CODE',
    label: 'Con código',
    description: 'El estudiante ingresa un código',
    icon: Key,
  },
  {
    value: 'PAID',
    label: 'De pago',
    description: 'Requiere pago (próximamente)',
    icon: CreditCard,
  },
]

// ─── Cover upload zone ────────────────────────────────────────────────────────

interface CoverUploadZoneProps {
  courseId: string
  initialCoverUrl: string | null
}

function CoverUploadZone({ courseId, initialCoverUrl }: CoverUploadZoneProps) {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(initialCoverUrl)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { mutate: uploadCover, isPending: isUploading } = useUploadCourseCover()
  const { mutate: updateCourse } = useUpdateCourse(courseId)

  function processFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5 MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    uploadCover(
      { file, courseId },
      {
        onSuccess: (url) => {
          URL.revokeObjectURL(objectUrl)
          setPreview(url)
          updateCourse(
            { coverUrl: url },
            {
              onSuccess: () => {
                toast.success('Portada actualizada')
                router.refresh()
              },
              onError: () => toast.error('Error al guardar la portada'),
            }
          )
        },
        onError: () => {
          URL.revokeObjectURL(objectUrl)
          setPreview(initialCoverUrl)
          toast.error('Error al subir la imagen')
        },
      }
    )
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      {preview && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Vista previa de portada" className="h-full w-full object-cover" />
        </div>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        aria-label="Subir imagen de portada"
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors',
          isDragging
            ? 'border-nexus-accent bg-nexus-accent-muted'
            : 'border-nexus-border bg-nexus-bg hover:border-nexus-accent/50'
        )}
      >
        {isUploading ? (
          <Loader2 className="text-nexus-accent h-8 w-8 animate-spin" aria-hidden="true" />
        ) : (
          <ImagePlus className="text-nexus-muted h-8 w-8" aria-hidden="true" />
        )}
        <div className="text-center">
          <p className="text-nexus-text text-sm font-medium">
            {isUploading
              ? 'Subiendo...'
              : preview
                ? 'Reemplazar imagen'
                : 'Subir imagen de portada'}
          </p>
          <p className="text-nexus-muted text-xs">
            Arrastrá o hacé clic · JPG, PNG, WebP · máx. 5 MB
          </p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  )
}

// ─── Course form ──────────────────────────────────────────────────────────────

interface CourseFormProps {
  mode: 'create' | 'edit'
  initialData?: Course
  categories: Category[]
}

const inputClass =
  'border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50'

export function CourseForm({ mode, initialData, categories }: CourseFormProps) {
  const router = useRouter()
  const { mutate: createCourse, isPending: isCreating } = useCreateCourse()
  const { mutate: updateCourse, isPending: isUpdating } = useUpdateCourse(initialData?.id ?? '')

  const isPending = isCreating || isUpdating

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      categoryId: initialData?.categoryId ?? '',
      enrollmentType: initialData?.enrollmentType ?? 'FREE',
      price: initialData?.price ?? undefined,
    },
  })

  const watchedEnrollmentType = form.watch('enrollmentType')

  function onSubmit(values: FormValues) {
    const data = {
      title: values.title,
      description: values.description || undefined,
      categoryId: values.categoryId || undefined,
      enrollmentType: values.enrollmentType,
      price: values.enrollmentType === 'PAID' ? values.price : undefined,
    }

    if (mode === 'create') {
      createCourse(data, {
        onSuccess: (course) => {
          toast.success('Curso creado')
          router.push(`/instructor/courses/${course.id}/edit`)
        },
        onError: () => toast.error('No se pudo crear el curso'),
      })
    } else {
      updateCourse(data, {
        onSuccess: () => {
          toast.success('Curso actualizado')
          router.refresh()
        },
        onError: () => toast.error('No se pudo actualizar el curso'),
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <div className="border-nexus-border bg-nexus-card rounded-xl border p-6">
        <h2 className="text-nexus-text mb-5 text-base font-semibold">Información básica</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">Título del curso</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Introducción a..."
                      autoComplete="off"
                      className={inputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">
                    Descripción <span className="text-nexus-muted font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <textarea
                      rows={4}
                      placeholder="Describí brevemente de qué trata el curso..."
                      className={cn(
                        inputClass,
                        'w-full resize-none rounded-lg border px-3 py-2 text-sm',
                        'placeholder:text-nexus-muted/60',
                        'focus:border-nexus-accent focus:ring-nexus-accent/50 focus:ring-2 focus:outline-none',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'transition-colors'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">
                    Categoría <span className="text-nexus-muted font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className={cn(
                        inputClass,
                        'w-full rounded-lg border px-3 py-2 text-sm',
                        'focus:border-nexus-accent focus:ring-nexus-accent/50 focus:ring-2 focus:outline-none',
                        'transition-colors'
                      )}
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Enrollment type selector */}
            <FormField
              control={form.control}
              name="enrollmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">Tipo de inscripción</FormLabel>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ENROLLMENT_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const isSelected = field.value === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            'flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors',
                            isSelected
                              ? 'border-nexus-accent bg-nexus-accent-muted'
                              : 'border-nexus-border bg-nexus-bg hover:border-nexus-accent/40'
                          )}
                          aria-pressed={isSelected}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              isSelected ? 'text-nexus-accent' : 'text-nexus-muted'
                            )}
                            aria-hidden="true"
                          />
                          <div>
                            <p
                              className={cn(
                                'text-xs font-semibold',
                                isSelected ? 'text-nexus-accent' : 'text-nexus-text'
                              )}
                            >
                              {option.label}
                            </p>
                            <p className="text-nexus-faint text-[10px] leading-tight">
                              {option.description}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Price — only shown for PAID */}
            {watchedEnrollmentType === 'PAID' && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-nexus-text font-medium">Precio (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ej: 29.99"
                        className={inputClass}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === '' ? undefined : Number(val))
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}

            {/* Submit */}
            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    {mode === 'create' ? 'Creando...' : 'Guardando...'}
                  </>
                ) : mode === 'create' ? (
                  'Crear curso'
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Cover image */}
      {mode === 'edit' && initialData ? (
        <div className="border-nexus-border bg-nexus-card rounded-xl border p-6">
          <h2 className="text-nexus-text mb-4 text-base font-semibold">Imagen de portada</h2>
          <CoverUploadZone courseId={initialData.id} initialCoverUrl={initialData.coverUrl} />
        </div>
      ) : (
        <div className="border-nexus-border bg-nexus-card flex items-start gap-3 rounded-xl border p-4">
          <Info className="text-nexus-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="text-nexus-muted text-sm">
            Podrás subir una imagen de portada después de crear el curso.
          </p>
        </div>
      )}
    </div>
  )
}
