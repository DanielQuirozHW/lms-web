'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, LayoutList } from 'lucide-react'
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
import { useCreateGradebookCategory } from '@/hooks/mutations/gradebook'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  weight: z.number().min(0).max(100, 'El peso máximo es 100'),
})

type FormValues = z.infer<typeof schema>

interface GradebookSetupProps {
  courseId: string
}

const inputClass =
  'border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50'

export function GradebookSetup({ courseId }: GradebookSetupProps) {
  const router = useRouter()
  const { mutate, isPending } = useCreateGradebookCategory(courseId)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', weight: 100 },
  })

  function onSubmit(values: FormValues) {
    mutate(values, {
      onSuccess: () => {
        toast.success('Categoría creada')
        router.refresh()
      },
      onError: () => toast.error('No se pudo crear la categoría'),
    })
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8 text-center">
      <div className="flex justify-center">
        <div className="bg-nexus-accent/15 flex h-16 w-16 items-center justify-center rounded-full">
          <LayoutList className="text-nexus-accent h-8 w-8" aria-hidden="true" />
        </div>
      </div>
      <div>
        <h2 className="text-nexus-text text-lg font-semibold">
          Configura el libro de calificaciones
        </h2>
        <p className="text-nexus-muted mt-1 text-sm">
          Creá la primera categoría para empezar a organizar las notas del curso.
        </p>
      </div>

      <div className="border-nexus-border bg-nexus-card rounded-xl border p-6 text-left">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">
                    Nombre de la categoría
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Tareas, Quizzes, Examen final"
                      autoFocus
                      className={inputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">
                    Peso en la nota final (%)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className={inputClass}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="bg-nexus-accent hover:bg-nexus-accent-hover w-full text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Creando...
                </>
              ) : (
                'Agregar categoría'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
