'use client'

import { useState } from 'react'
import {
  GripVertical,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Globe,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  Loader2,
  Settings2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'
import { ModuleForm } from './ModuleForm'
import { LessonForm } from './LessonForm'
import { QuizEditor } from '@/components/features/quiz/QuizEditor'
import { AssignmentEditor } from '@/components/features/assignments/AssignmentEditor'
import {
  useDeleteModule,
  usePublishModule,
  useReorderModules,
  useDeleteLesson,
  usePublishLesson,
  useReorderLessons,
} from '@/hooks/mutations/modules'
import type { CourseModule, LessonType } from '@/types/models'
import type { ModuleWithLessons, LessonWithDetails } from '@/hooks/queries/modules'

// ─── Icons ────────────────────────────────────────────────────────────────────

const lessonTypeIcon: Record<LessonType, React.ElementType> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
}

const lessonTypeLabel: Record<LessonType, string> = {
  VIDEO: 'Video',
  TEXT: 'Texto',
  QUIZ: 'Quiz',
  ASSIGNMENT: 'Tarea',
}

// ─── Lesson row ───────────────────────────────────────────────────────────────

interface LessonRowProps {
  lesson: LessonWithDetails
  courseId: string
  moduleId: string
  onEdit: () => void
  onDelete: (id: string) => void
  onPublish: (id: string, updated: LessonWithDetails) => void
  onConfigure?: () => void
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>
  isDragOver: boolean
}

function LessonRow({
  lesson,
  courseId,
  moduleId,
  onEdit,
  onDelete,
  onPublish,
  onConfigure,
  dragHandleProps,
  isDragOver,
}: LessonRowProps) {
  const Icon = lessonTypeIcon[lesson.type]
  const { mutate: publishLesson, isPending: isPublishing } = usePublishLesson(
    courseId,
    moduleId,
    lesson.id
  )
  const { mutate: deleteLesson, isPending: isDeleting } = useDeleteLesson(
    courseId,
    moduleId,
    lesson.id
  )

  function handlePublish() {
    publishLesson(undefined, {
      onSuccess: (updated) => {
        toast.success('Lección publicada')
        onPublish(lesson.id, { ...lesson, ...updated })
      },
      onError: () => toast.error('No se pudo publicar la lección'),
    })
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar la lección "${lesson.title}"?`)) return
    deleteLesson(undefined, {
      onSuccess: () => {
        toast.success('Lección eliminada')
        onDelete(lesson.id)
      },
      onError: () => toast.error('No se pudo eliminar la lección'),
    })
  }

  return (
    <li
      className={cn(
        'bg-nexus-surface flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
        isDragOver ? 'border-nexus-accent' : 'border-nexus-border'
      )}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="text-nexus-muted/40 hover:text-nexus-muted cursor-grab"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </div>

      <Icon className="text-nexus-muted h-4 w-4 shrink-0" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <span className="text-nexus-text truncate text-sm">{lesson.title}</span>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-nexus-muted text-[10px]">{lessonTypeLabel[lesson.type]}</span>
          {lesson.duration != null && lesson.duration > 0 && (
            <span className="text-nexus-muted text-[10px]">{formatDuration(lesson.duration)}</span>
          )}
          {lesson.isPreview && (
            <span className="bg-nexus-accent/15 text-nexus-accent rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
              Vista previa
            </span>
          )}
        </div>
      </div>

      {/* Published badge */}
      {lesson.isPublished && (
        <span className="bg-nexus-success/15 text-nexus-success shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold">
          Publicado
        </span>
      )}

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {!lesson.isPublished && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePublish}
            disabled={isPublishing}
            className="text-nexus-muted hover:text-nexus-success h-7 gap-1 px-2 text-xs"
          >
            {isPublishing ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <Globe className="h-3 w-3" aria-hidden="true" />
            )}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="text-nexus-muted hover:text-nexus-text h-7 px-2"
          aria-label="Editar lección"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
        </Button>
        {onConfigure && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onConfigure}
            className="text-nexus-muted hover:text-nexus-accent h-7 px-2"
            aria-label="Configurar quiz/tarea"
          >
            <Settings2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-nexus-muted hover:text-destructive h-7 px-2"
          aria-label="Eliminar lección"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          )}
        </Button>
      </div>
    </li>
  )
}

// ─── Module row ───────────────────────────────────────────────────────────────

interface ModuleRowProps {
  module: ModuleWithLessons
  index: number
  courseId: string
  isExpanded: boolean
  isEditing: boolean
  onToggleExpand: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveModule: (updated: CourseModule) => void
  onDeleteModule: (id: string) => void
  onPublishModule: (id: string, updated: CourseModule) => void
  onLessonCreate: (moduleId: string) => void
  onLessonEdit: (lesson: LessonWithDetails, moduleId: string) => void
  onLessonDelete: (lessonId: string, moduleId: string) => void
  onLessonPublish: (lessonId: string, moduleId: string, updated: LessonWithDetails) => void
  onLessonsReorder: (moduleId: string, newLessons: LessonWithDetails[]) => void
  onLessonConfigure: (lesson: LessonWithDetails) => void
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>
  isDragOver: boolean
}

function ModuleRow({
  module,
  courseId,
  isExpanded,
  isEditing,
  onToggleExpand,
  onStartEdit,
  onCancelEdit,
  onSaveModule,
  onDeleteModule,
  onPublishModule,
  onLessonCreate,
  onLessonEdit,
  onLessonDelete,
  onLessonPublish,
  onLessonsReorder,
  onLessonConfigure,
  dragHandleProps,
  isDragOver,
}: ModuleRowProps) {
  const { mutate: publishModule, isPending: isPublishing } = usePublishModule(courseId, module.id)
  const { mutate: deleteModule, isPending: isDeleting } = useDeleteModule(courseId, module.id)
  const { mutate: reorderLessons } = useReorderLessons(courseId, module.id)

  // Lesson drag state (local to this module row)
  const [lessonDragSrc, setLessonDragSrc] = useState<number | null>(null)
  const [lessonDragOver, setLessonDragOver] = useState<number | null>(null)

  function handlePublish() {
    publishModule(undefined, {
      onSuccess: (updated) => {
        toast.success('Módulo publicado')
        onPublishModule(module.id, updated)
      },
      onError: () => toast.error('No se pudo publicar el módulo'),
    })
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar el módulo "${module.title}" y todas sus lecciones?`)) return
    deleteModule(undefined, {
      onSuccess: () => {
        toast.success('Módulo eliminado')
        onDeleteModule(module.id)
      },
      onError: () => toast.error('No se pudo eliminar el módulo'),
    })
  }

  function handleLessonDrop(targetIndex: number) {
    if (lessonDragSrc === null || lessonDragSrc === targetIndex) {
      setLessonDragSrc(null)
      setLessonDragOver(null)
      return
    }
    const newLessons = [...module.lessons]
    const [dragged] = newLessons.splice(lessonDragSrc, 1)
    newLessons.splice(targetIndex, 0, dragged)
    onLessonsReorder(module.id, newLessons)
    reorderLessons(
      newLessons.map((l) => l.id),
      {
        onError: () => {
          toast.error('No se pudo reordenar las lecciones')
          onLessonsReorder(module.id, module.lessons) // roll back
        },
      }
    )
    setLessonDragSrc(null)
    setLessonDragOver(null)
  }

  return (
    <div
      className={cn(
        'bg-nexus-card rounded-xl border transition-colors',
        isDragOver ? 'border-nexus-accent' : 'border-nexus-border'
      )}
    >
      {/* Module header */}
      {isEditing ? (
        <div className="p-4">
          <ModuleForm
            courseId={courseId}
            moduleId={module.id}
            initialData={module}
            onSuccess={onSaveModule}
            onCancel={onCancelEdit}
          />
        </div>
      ) : (
        <div
          className="flex cursor-pointer items-center gap-3 p-4"
          onClick={onToggleExpand}
          role="button"
          aria-expanded={isExpanded}
        >
          {/* Drag handle — stop click propagation */}
          <div
            {...dragHandleProps}
            className="text-nexus-muted/40 hover:text-nexus-muted cursor-grab"
            aria-label="Arrastrar módulo"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-5 w-5" aria-hidden="true" />
          </div>

          <span className="text-nexus-muted w-5 shrink-0 text-right text-xs">{module.order}</span>

          <div className="min-w-0 flex-1">
            <p className="text-nexus-text truncate text-sm font-semibold">{module.title}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {module.isPublished && (
              <span className="bg-nexus-success/15 text-nexus-success rounded-full px-2 py-0.5 text-[10px] font-semibold">
                Publicado
              </span>
            )}
            <span className="text-nexus-muted text-xs">{module.lessons.length} lec.</span>

            {/* Action buttons — stop propagation */}
            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              {!module.isPublished && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="text-nexus-muted hover:text-nexus-success h-7 px-2"
                  aria-label="Publicar módulo"
                >
                  {isPublishing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onStartEdit}
                className="text-nexus-muted hover:text-nexus-text h-7 px-2"
                aria-label="Editar módulo"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-nexus-muted hover:text-destructive h-7 px-2"
                aria-label="Eliminar módulo"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
            </div>

            <ChevronDown
              className={cn(
                'text-nexus-muted h-4 w-4 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {/* Expanded lesson list */}
      {isExpanded && !isEditing && (
        <div className="border-nexus-border border-t px-4 pt-3 pb-4">
          {module.lessons.length > 0 ? (
            <ul className="mb-3 space-y-2">
              {module.lessons.map((lesson, li) => (
                <div
                  key={lesson.id}
                  draggable
                  onDragStart={() => setLessonDragSrc(li)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setLessonDragOver(li)
                  }}
                  onDrop={() => handleLessonDrop(li)}
                  onDragEnd={() => {
                    setLessonDragSrc(null)
                    setLessonDragOver(null)
                  }}
                  className={cn(lessonDragSrc === li && 'opacity-50')}
                >
                  <LessonRow
                    lesson={lesson}
                    courseId={courseId}
                    moduleId={module.id}
                    onEdit={() => onLessonEdit(lesson, module.id)}
                    onDelete={(id) => onLessonDelete(id, module.id)}
                    onPublish={(id, updated) => onLessonPublish(id, module.id, updated)}
                    onConfigure={
                      lesson.type === 'QUIZ' || lesson.type === 'ASSIGNMENT'
                        ? () => onLessonConfigure(lesson)
                        : undefined
                    }
                    dragHandleProps={{}} // handled by outer div
                    isDragOver={lessonDragOver === li && lessonDragSrc !== li}
                  />
                </div>
              ))}
            </ul>
          ) : (
            <p className="text-nexus-muted mb-3 text-xs">Sin lecciones aún.</p>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onLessonCreate(module.id)}
            className="border-nexus-border text-nexus-muted hover:text-nexus-text"
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Agregar lección
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── ModuleList ───────────────────────────────────────────────────────────────

interface ModuleListProps {
  courseId: string
  initialModules: ModuleWithLessons[]
}

export function ModuleList({ courseId, initialModules }: ModuleListProps) {
  const [modules, setModules] = useState<ModuleWithLessons[]>(initialModules)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [lessonFormState, setLessonFormState] = useState<{
    moduleId: string
    lesson?: LessonWithDetails
  } | null>(null)
  const [editorPanel, setEditorPanel] = useState<{
    type: 'quiz' | 'assignment'
    lessonId: string
    lessonTitle: string
  } | null>(null)

  // Module DnD state
  const [modDragSrc, setModDragSrc] = useState<number | null>(null)
  const [modDragOver, setModDragOver] = useState<number | null>(null)

  const { mutate: reorderModules } = useReorderModules(courseId)

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Module DnD ──

  function handleModDrop(targetIndex: number) {
    if (modDragSrc === null || modDragSrc === targetIndex) {
      setModDragSrc(null)
      setModDragOver(null)
      return
    }
    const original = modules
    const newModules = [...modules]
    const [dragged] = newModules.splice(modDragSrc, 1)
    newModules.splice(targetIndex, 0, dragged)
    setModules(newModules)
    reorderModules(
      newModules.map((m) => m.id),
      {
        onError: () => {
          toast.error('No se pudo reordenar los módulos')
          setModules(original)
        },
      }
    )
    setModDragSrc(null)
    setModDragOver(null)
  }

  // ── Module callbacks ──

  function handleModuleCreated(mod: CourseModule) {
    setModules((prev) => [...prev, { ...mod, lessons: [] }])
    setShowCreateModule(false)
    setExpandedIds((prev) => new Set([...prev, mod.id]))
  }

  function handleModuleUpdated(updated: CourseModule) {
    setModules((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
    setEditingModuleId(null)
  }

  function handleModuleDeleted(id: string) {
    setModules((prev) => prev.filter((m) => m.id !== id))
  }

  function handleModulePublished(id: string, updated: CourseModule) {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)))
  }

  // ── Lesson callbacks ──

  function handleLessonCreated(moduleId: string, lesson: LessonWithDetails) {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m))
    )
  }

  function handleLessonUpdated(moduleId: string, updated: LessonWithDetails) {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === updated.id ? updated : l)) }
          : m
      )
    )
  }

  function handleLessonDeleted(lessonId: string, moduleId: string) {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
      )
    )
  }

  function handleLessonPublished(lessonId: string, moduleId: string, updated: LessonWithDetails) {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === lessonId ? updated : l)) }
          : m
      )
    )
  }

  function handleLessonsReorder(moduleId: string, newLessons: LessonWithDetails[]) {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, lessons: newLessons } : m)))
  }

  // ── Lesson form ──

  function handleLessonFormSuccess(lesson: LessonWithDetails) {
    if (!lessonFormState) return
    if (lessonFormState.lesson) {
      handleLessonUpdated(lessonFormState.moduleId, lesson)
    } else {
      handleLessonCreated(lessonFormState.moduleId, lesson)
    }
  }

  return (
    <>
      <div className="space-y-3">
        {/* Module list */}
        {modules.map((mod, mi) => (
          <div
            key={mod.id}
            draggable
            onDragStart={() => {
              setModDragSrc(mi)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setModDragOver(mi)
            }}
            onDrop={() => handleModDrop(mi)}
            onDragEnd={() => {
              setModDragSrc(null)
              setModDragOver(null)
            }}
            className={cn(modDragSrc === mi && 'opacity-50')}
          >
            <ModuleRow
              module={mod}
              index={mi}
              courseId={courseId}
              isExpanded={expandedIds.has(mod.id)}
              isEditing={editingModuleId === mod.id}
              onToggleExpand={() => toggleExpand(mod.id)}
              onStartEdit={() => {
                setEditingModuleId(mod.id)
                setExpandedIds((prev) => new Set([...prev, mod.id]))
              }}
              onCancelEdit={() => setEditingModuleId(null)}
              onSaveModule={handleModuleUpdated}
              onDeleteModule={handleModuleDeleted}
              onPublishModule={handleModulePublished}
              onLessonCreate={(moduleId) => {
                setLessonFormState({ moduleId })
                setExpandedIds((prev) => new Set([...prev, moduleId]))
              }}
              onLessonEdit={(lesson, moduleId) => setLessonFormState({ moduleId, lesson })}
              onLessonDelete={handleLessonDeleted}
              onLessonPublish={handleLessonPublished}
              onLessonsReorder={handleLessonsReorder}
              onLessonConfigure={(lesson) =>
                setEditorPanel({
                  type: lesson.type === 'QUIZ' ? 'quiz' : 'assignment',
                  lessonId: lesson.id,
                  lessonTitle: lesson.title,
                })
              }
              dragHandleProps={{
                onDragStart: () => setModDragSrc(mi),
              }}
              isDragOver={modDragOver === mi && modDragSrc !== mi}
            />
          </div>
        ))}

        {/* Create module form or button */}
        {showCreateModule ? (
          <ModuleForm
            courseId={courseId}
            onSuccess={handleModuleCreated}
            onCancel={() => setShowCreateModule(false)}
          />
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowCreateModule(true)}
            className="border-nexus-border text-nexus-muted hover:border-nexus-accent hover:text-nexus-accent w-full border-dashed"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Agregar módulo
          </Button>
        )}

        {/* Lesson form modal */}
        {lessonFormState && (
          <LessonForm
            courseId={courseId}
            moduleId={lessonFormState.moduleId}
            lesson={lessonFormState.lesson}
            onClose={() => setLessonFormState(null)}
            onSuccess={handleLessonFormSuccess}
          />
        )}
      </div>

      {/* Slide-over editor panel (Quiz / Assignment) */}
      {editorPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setEditorPanel(null)}
            aria-hidden="true"
          />
          {/* Panel */}
          <aside
            className="bg-nexus-surface fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden shadow-2xl sm:w-120"
            aria-label={`Configurar ${editorPanel.type === 'quiz' ? 'quiz' : 'tarea'}`}
          >
            {/* Panel header */}
            <div className="border-nexus-border flex shrink-0 items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-nexus-muted text-[10px] font-semibold tracking-wide uppercase">
                  {editorPanel.type === 'quiz' ? 'Quiz' : 'Tarea'}
                </p>
                <h2 className="text-nexus-text truncate text-sm font-semibold">
                  {editorPanel.lessonTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditorPanel(null)}
                aria-label="Cerrar panel"
                className="text-nexus-muted hover:text-nexus-text transition-colors"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-4">
              {editorPanel.type === 'quiz' ? (
                <QuizEditor lessonId={editorPanel.lessonId} />
              ) : (
                <AssignmentEditor lessonId={editorPanel.lessonId} />
              )}
            </div>
          </aside>
        </>
      )}
    </>
  )
}
