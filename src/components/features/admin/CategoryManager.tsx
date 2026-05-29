'use client'

import { useState, useRef } from 'react'
import { Pencil, Trash2, Check, X, Plus, Loader2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/mutations/categories'
import { isApiError } from '@/lib/api'
import type { Category } from '@/types/models'

interface CategoryManagerProps {
  initialCategories: Category[]
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  const editInputRef = useRef<HTMLInputElement>(null)
  const createInputRef = useRef<HTMLInputElement>(null)

  const { mutate: createCategory, isPending: isCreating } = useCreateCategory()
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory()

  function startEdit(category: Category) {
    setEditingId(category.id)
    setEditName(category.name)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    createCategory(
      { name },
      {
        onSuccess: (created) => {
          toast.success('Categoría creada')
          setCategories((prev) => [...prev, created])
          setNewName('')
          setShowCreate(false)
        },
        onError: () => toast.error('No se pudo crear la categoría'),
      }
    )
  }

  function handleDelete(categoryId: string) {
    deleteCategory(categoryId, {
      onSuccess: () => {
        toast.success('Categoría eliminada')
        setCategories((prev) => prev.filter((c) => c.id !== categoryId))
        setDeleteConfirmId(null)
      },
      onError: (error) => {
        if (isApiError(error) && error.response?.data.statusCode === 409) {
          toast.error('No se puede eliminar — tiene cursos asignados')
        } else {
          toast.error('No se pudo eliminar la categoría')
        }
        setDeleteConfirmId(null)
      },
    })
  }

  return (
    <>
      <div className="space-y-2">
        {/* Category list */}
        {categories.length === 0 && !showCreate && (
          <p className="text-nexus-muted py-8 text-center text-sm">
            Sin categorías. Creá la primera.
          </p>
        )}

        {categories.map((cat) => (
          <div
            key={cat.id}
            className="border-nexus-border bg-nexus-card flex items-center gap-3 rounded-xl border px-4 py-3"
          >
            {editingId === cat.id ? (
              // ── Inline edit mode ──
              <EditRow
                categoryId={cat.id}
                editName={editName}
                editInputRef={editInputRef}
                onNameChange={setEditName}
                onSave={(updated) => {
                  setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
                  setEditingId(null)
                }}
                onCancel={cancelEdit}
              />
            ) : (
              // ── Display mode ──
              <>
                <span className="text-nexus-text flex-1 text-sm font-medium">{cat.name}</span>
                <span className="text-nexus-muted text-xs">{cat.slug}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(cat)}
                    className="text-nexus-muted hover:text-nexus-text h-7 px-2"
                    aria-label={`Editar categoría ${cat.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirmId(cat.id)}
                    className="text-nexus-muted hover:text-destructive h-7 px-2"
                    aria-label={`Eliminar categoría ${cat.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Create form */}
        {showCreate ? (
          <div className="border-nexus-border bg-nexus-card flex items-center gap-2 rounded-xl border px-4 py-3">
            <input
              ref={createInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre de la categoría"
              aria-label="Nombre de nueva categoría"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') {
                  setShowCreate(false)
                  setNewName('')
                }
              }}
              className="text-nexus-text placeholder:text-nexus-muted/60 flex-1 bg-transparent text-sm focus:outline-none"
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
              className="bg-nexus-accent hover:bg-nexus-accent-hover h-7 px-2 text-white"
              aria-label="Guardar categoría"
            >
              {isCreating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCreate(false)
                setNewName('')
              }}
              disabled={isCreating}
              className="text-nexus-muted hover:text-nexus-text h-7 px-2"
              aria-label="Cancelar"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setShowCreate(true)
              setTimeout(() => createInputRef.current?.focus(), 0)
            }}
            className="border-nexus-border text-nexus-muted hover:border-nexus-accent hover:text-nexus-accent w-full border-dashed"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nueva categoría
          </Button>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-cat-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeleteConfirmId(null)
          }}
        >
          <div className="border-nexus-border bg-nexus-card w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="bg-destructive/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <TriangleAlert className="text-destructive h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="delete-cat-title" className="text-nexus-text text-base font-semibold">
                  ¿Eliminar esta categoría?
                </h3>
                <p className="text-nexus-muted mt-1 text-sm">
                  Los cursos asignados a esta categoría quedarán sin categoría. Si la categoría
                  tiene cursos activos, la operación fallará.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="border-nexus-border text-nexus-muted"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Inline edit row (isolated so it can use its own mutation hook) ────────────

interface EditRowProps {
  categoryId: string
  editName: string
  editInputRef: React.RefObject<HTMLInputElement | null>
  onNameChange: (v: string) => void
  onSave: (updated: Category) => void
  onCancel: () => void
}

function EditRow({
  categoryId,
  editName,
  editInputRef,
  onNameChange,
  onSave,
  onCancel,
}: EditRowProps) {
  const { mutate: updateCategory, isPending } = useUpdateCategory(categoryId)

  function handleSave() {
    const name = editName.trim()
    if (!name) return
    updateCategory(
      { name },
      {
        onSuccess: (updated) => {
          toast.success('Categoría actualizada')
          onSave(updated)
        },
        onError: () => toast.error('No se pudo actualizar la categoría'),
      }
    )
  }

  return (
    <>
      <input
        ref={editInputRef}
        type="text"
        value={editName}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') onCancel()
        }}
        className="text-nexus-text flex-1 bg-transparent text-sm focus:outline-none"
        aria-label="Editar nombre de categoría"
      />
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!editName.trim() || isPending}
          className={cn('h-7 px-2 text-white', 'bg-nexus-accent hover:bg-nexus-accent-hover')}
          aria-label="Guardar cambios"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
          className="text-nexus-muted hover:text-nexus-text h-7 px-2"
          aria-label="Cancelar edición"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </>
  )
}
