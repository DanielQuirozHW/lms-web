'use client'

import { useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Info,
  AlertTriangle,
  Wrench,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { useGlobalAnnouncements } from '@/hooks/queries/announcements-global'
import {
  useUpdateGlobalAnnouncement,
  useDeleteGlobalAnnouncement,
} from '@/hooks/mutations/announcements-global'
import { AnnouncementFormDialog } from './AnnouncementFormDialog'
import type { GlobalAnnouncement, GlobalAnnouncementType } from '@/types/models'

const typeConfig: Record<
  GlobalAnnouncementType,
  {
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
    label: string
    className: string
  }
> = {
  INFO: { icon: Info, label: 'Info', className: 'bg-blue-500/15 text-blue-400' },
  WARNING: {
    icon: AlertTriangle,
    label: 'Advertencia',
    className: 'bg-amber-500/15 text-amber-400',
  },
  MAINTENANCE: { icon: Wrench, label: 'Mantenimiento', className: 'bg-red-500/15 text-red-400' },
  SUCCESS: {
    icon: CheckCircle,
    label: 'Éxito',
    className: 'bg-nexus-success/15 text-nexus-success',
  },
}

interface GlobalAnnouncementManagerProps {
  initialAnnouncements?: GlobalAnnouncement[]
}

export function GlobalAnnouncementManager({
  initialAnnouncements,
}: GlobalAnnouncementManagerProps) {
  const { data: announcements = [] } = useGlobalAnnouncements(initialAnnouncements)
  const {
    mutate: toggleActive,
    isPending: isToggling,
    variables: togglingVars,
  } = useUpdateGlobalAnnouncement()
  const {
    mutate: deleteAnn,
    isPending: isDeleting,
    variables: deletingId,
  } = useDeleteGlobalAnnouncement()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<GlobalAnnouncement | undefined>()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function openCreate() {
    setEditingAnnouncement(undefined)
    setDialogOpen(true)
  }

  function openEdit(a: GlobalAnnouncement) {
    setEditingAnnouncement(a)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingAnnouncement(undefined)
  }

  function handleToggle(a: GlobalAnnouncement) {
    toggleActive({ id: a.id, data: { isActive: !a.isActive } })
  }

  function handleDeleteConfirm(id: string) {
    deleteAnn(id, {
      onSuccess: () => setConfirmDeleteId(null),
    })
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-nexus-muted text-sm">
            {announcements.length} alerta{announcements.length !== 1 && 's'} en total
          </p>
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Nueva alerta
          </Button>
        </div>

        {announcements.length === 0 ? (
          <div className="border-nexus-border rounded-xl border py-12 text-center">
            <p className="text-nexus-muted text-sm">No hay alertas configuradas</p>
          </div>
        ) : (
          <div className="border-nexus-border overflow-x-auto rounded-xl border">
            <table className="w-full text-sm" aria-label="Alertas globales">
              <thead>
                <tr className="border-nexus-border bg-nexus-card border-b">
                  {['Tipo', 'Título', 'Mensaje', 'Activa', 'Vence', ''].map((h) => (
                    <th
                      key={h}
                      className="text-nexus-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-nexus-border divide-y">
                {announcements.map((a) => {
                  const cfg = typeConfig[a.type]
                  const Icon = cfg.icon
                  const isThisToggling = isToggling && togglingVars?.id === a.id
                  const isThisDeleting = isDeleting && deletingId === a.id

                  return (
                    <tr
                      key={a.id}
                      className="bg-nexus-card hover:bg-nexus-accent-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            cfg.className
                          )}
                        >
                          <Icon className="h-3 w-3" aria-hidden />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="text-nexus-text max-w-[180px] truncate px-4 py-3 font-medium">
                        {a.title}
                      </td>
                      <td className="text-nexus-muted max-w-[240px] truncate px-4 py-3">
                        {a.message}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={a.isActive}
                          onClick={() => handleToggle(a)}
                          disabled={isThisToggling}
                          title={a.isActive ? 'Desactivar' : 'Activar'}
                          className={cn(
                            'focus:ring-nexus-accent relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-1 focus:outline-none disabled:opacity-50',
                            a.isActive ? 'bg-nexus-accent' : 'bg-nexus-border'
                          )}
                        >
                          {isThisToggling ? (
                            <Loader2 className="mx-auto h-3 w-3 animate-spin text-white" />
                          ) : (
                            <span
                              className={cn(
                                'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                                a.isActive ? 'translate-x-[18px]' : 'translate-x-[2px]'
                              )}
                            />
                          )}
                        </button>
                      </td>
                      <td className="text-nexus-muted px-4 py-3 text-xs">
                        {a.endsAt ? formatDate(a.endsAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {confirmDeleteId === a.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteConfirm(a.id)}
                              disabled={isThisDeleting}
                              className="text-destructive hover:text-destructive/80 text-xs font-medium transition-colors"
                            >
                              {isThisDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                'Confirmar'
                              )}
                            </button>
                            <span className="text-nexus-muted">/</span>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-nexus-muted hover:text-nexus-text text-xs transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(a)}
                              className="text-nexus-muted hover:text-nexus-text h-7 px-2"
                              aria-label="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDeleteId(a.id)}
                              className="text-nexus-muted hover:text-destructive h-7 px-2 transition-colors"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dialogOpen && (
        <AnnouncementFormDialog announcement={editingAnnouncement} onClose={closeDialog} />
      )}
    </>
  )
}
