'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Loader2 } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUpdateProfileMutation, useUploadAvatarMutation } from '@/hooks/mutations/users'
import type { User } from '@/types/models'

const schema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
})

type FormValues = z.infer<typeof schema>

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfileMutation()
  const { mutate: uploadAvatar } = useUploadAvatarMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
  })

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || 'U'

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5 MB')
      e.target.value = ''
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP')
      e.target.value = ''
      return
    }

    setIsUploading(true)
    uploadAvatar(file, {
      onSuccess: (url) => {
        setAvatarUrl(url)
        updateProfile(
          { avatarUrl: url },
          {
            onSuccess: () => {
              toast.success('Foto de perfil actualizada')
              router.refresh()
            },
            onError: () => toast.error('Error al guardar la foto'),
            onSettled: () => setIsUploading(false),
          }
        )
      },
      onError: () => {
        toast.error('Error al subir la imagen')
        setIsUploading(false)
        e.target.value = ''
      },
    })

    // Reset so the same file can be re-selected if needed
    e.target.value = ''
  }

  function onSubmit(values: FormValues) {
    updateProfile(values, {
      onSuccess: () => {
        toast.success('Perfil actualizado')
        form.reset(values) // clear dirty state
        router.refresh()
      },
      onError: () => toast.error('No se pudo actualizar el perfil'),
    })
  }

  return (
    <div className="space-y-6">
      {/* Avatar editor */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={isUploading}
          aria-label="Cambiar foto de perfil"
          className="group relative cursor-pointer focus-visible:outline-none"
        >
          <Avatar className="size-20">
            {isUploading ? (
              <div className="bg-nexus-card flex size-full items-center justify-center rounded-full">
                <Loader2 className="text-nexus-accent h-6 w-6 animate-spin" aria-hidden="true" />
              </div>
            ) : (
              <>
                <AvatarImage src={avatarUrl ?? undefined} alt="Foto de perfil" />
                <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-xl">
                  {initials}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
        </button>
        <div>
          <p className="text-nexus-text text-sm font-medium">Foto de perfil</p>
          <p className="text-nexus-muted text-xs">JPG, PNG o WebP — máx. 5 MB</p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {/* Name fields */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">Nombre</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="given-name"
                      className="border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">Apellido</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="family-name"
                      className="border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!form.formState.isDirty || isSaving}
              className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
