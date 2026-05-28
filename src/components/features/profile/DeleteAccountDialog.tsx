'use client'

import { useState } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDeleteAccountMutation } from '@/hooks/mutations/users'
import { isApiError } from '@/lib/api'

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { mutate: deleteAccount, isPending } = useDeleteAccountMutation()

  function open() {
    setPassword('')
    setError(null)
    setIsOpen(true)
  }

  function close() {
    if (isPending) return
    setIsOpen(false)
    setPassword('')
    setError(null)
  }

  function handleConfirm() {
    if (!password) {
      setError('Ingresá tu contraseña para confirmar')
      return
    }
    setError(null)

    deleteAccount(
      { password },
      {
        onSuccess: async () => {
          toast.success('Tu cuenta fue eliminada')
          await signOut({ callbackUrl: '/login' })
        },
        onError: (err) => {
          if (isApiError(err) && err.response?.data.statusCode === 401) {
            setError('Contraseña incorrecta')
          } else {
            toast.error('No se pudo eliminar la cuenta. Intentá de nuevo.')
          }
        },
      }
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        onClick={open}
        className="bg-destructive/10 text-destructive hover:bg-destructive/20"
      >
        Eliminar cuenta
      </Button>

      {/* Custom dialog — AlertDialog not installed */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div className="border-nexus-border bg-nexus-card w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
            {/* Icon + title */}
            <div className="mb-4 flex items-start gap-3">
              <div className="bg-destructive/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <TriangleAlert className="text-destructive h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="delete-dialog-title" className="text-nexus-text text-base font-semibold">
                  ¿Eliminar tu cuenta?
                </h2>
                <p className="text-nexus-muted mt-1 text-sm">
                  Esta acción es irreversible. Se eliminarán todos tus datos, inscripciones y
                  progreso.
                </p>
              </div>
            </div>

            {/* Password confirmation */}
            <div className="mb-4 space-y-1.5">
              <label
                htmlFor="delete-confirm-password"
                className="text-nexus-text text-sm font-medium"
              >
                Ingresá tu contraseña para confirmar
              </label>
              <Input
                id="delete-confirm-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                autoComplete="current-password"
                aria-describedby={error ? 'delete-password-error' : undefined}
                className="border-nexus-border bg-nexus-bg text-nexus-text focus-visible:ring-nexus-accent/50"
              />
              {error && (
                <p id="delete-password-error" role="alert" className="text-destructive text-xs">
                  {error}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={close}
                disabled={isPending}
                className="border-nexus-border text-nexus-muted"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || !password}
                className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar cuenta'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
