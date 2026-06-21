'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Loader2, Mail, Phone, Cake, MapPin } from 'lucide-react'
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
import { useUpdateProfileMutation, useUploadAvatarMutation } from '@/hooks/mutations/users'
import type { User } from '@/types/models'
import { useRef, useState } from 'react'

const schema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().max(20).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
  bio: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

interface ProfileFormProps {
  user: User
}

const FIELD_STYLE = {
  background: 'var(--field-bg)',
  borderColor: 'var(--field-border)',
  color: 'var(--nexus-text)',
} as const

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
      phone: '',
      birthDate: '',
      location: '',
      bio: '',
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

    e.target.value = ''
  }

  function onSubmit(values: FormValues) {
    updateProfile(
      { firstName: values.firstName, lastName: values.lastName },
      {
        onSuccess: () => {
          toast.success('Perfil actualizado')
          form.reset(values)
          router.refresh()
        },
        onError: () => toast.error('No se pudo actualizar el perfil'),
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={isUploading}
          aria-label="Cambiar foto de perfil"
          className="group relative cursor-pointer focus-visible:outline-none"
        >
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: 20,
              overflow: 'hidden',
              background: 'var(--nexus-accent-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--nexus-accent)',
            }}
          >
            {isUploading ? (
              <Loader2 className="text-nexus-accent h-6 w-6 animate-spin" aria-hidden="true" />
            ) : avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Foto de perfil"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
            style={{ background: 'rgba(0,0,0,.45)', borderRadius: 20 }}
          >
            <Camera className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
        </button>
        <div>
          <p className="text-nexus-text text-sm font-medium">Foto de perfil</p>
          <p className="text-nexus-muted text-xs">JPG, PNG o WebP — máx. 5 MB</p>
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

      {/* Form fields */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Nombre + Apellido */}
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
                      className="focus-visible:ring-nexus-accent/50 h-12 rounded-[12px]"
                      style={FIELD_STYLE}
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
                      className="focus-visible:ring-nexus-accent/50 h-12 rounded-[12px]"
                      style={FIELD_STYLE}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Email — read-only */}
          <div>
            <p className="text-nexus-text mb-1.5 text-sm font-medium">Email</p>
            <div
              className="relative flex h-12 items-center rounded-[12px] border"
              style={{
                background: 'var(--field-bg)',
                borderColor: 'var(--field-border)',
                opacity: 0.7,
              }}
            >
              <Mail
                aria-hidden="true"
                className="text-nexus-faint absolute shrink-0"
                style={{ left: 14, width: 16, height: 16 }}
              />
              <span
                className="text-nexus-muted pl-10 text-sm"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {user.email}
              </span>
            </div>
          </div>

          {/* Teléfono + Fecha de nacimiento */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">Teléfono</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone
                        aria-hidden="true"
                        className="text-nexus-faint absolute top-1/2 shrink-0 -translate-y-1/2"
                        style={{ left: 14, width: 16, height: 16 }}
                      />
                      <Input
                        type="tel"
                        autoComplete="tel"
                        placeholder="+52 555 123 4567"
                        className="focus-visible:ring-nexus-accent/50 h-12 rounded-[12px] pl-10"
                        style={FIELD_STYLE}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nexus-text font-medium">Fecha de nacimiento</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Cake
                        aria-hidden="true"
                        className="text-nexus-faint absolute top-1/2 shrink-0 -translate-y-1/2"
                        style={{ left: 14, width: 16, height: 16 }}
                      />
                      <Input
                        type="date"
                        className="focus-visible:ring-nexus-accent/50 h-12 rounded-[12px] pl-10"
                        style={FIELD_STYLE}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Ubicación */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-nexus-text font-medium">Ubicación</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin
                      aria-hidden="true"
                      className="text-nexus-faint absolute top-1/2 shrink-0 -translate-y-1/2"
                      style={{ left: 14, width: 16, height: 16 }}
                    />
                    <Input
                      type="text"
                      autoComplete="address-level2"
                      placeholder="Ciudad, País"
                      className="focus-visible:ring-nexus-accent/50 h-12 rounded-[12px] pl-10"
                      style={FIELD_STYLE}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Biografía */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-nexus-text font-medium">Biografía</FormLabel>
                  <span className="text-nexus-faint text-xs">{(field.value ?? '').length}/200</span>
                </div>
                <FormControl>
                  <textarea
                    rows={3}
                    maxLength={200}
                    placeholder="Cuéntanos un poco sobre ti..."
                    className="focus-visible:ring-nexus-accent/50 w-full resize-none rounded-[12px] border px-4 py-3 text-sm transition-colors outline-none focus-visible:ring-2"
                    style={FIELD_STYLE}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-1">
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
