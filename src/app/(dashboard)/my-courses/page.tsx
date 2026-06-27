import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { EnrollmentStatus, UserEnrollmentItem } from '@/types/models'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { MyCoursesFilter } from '@/components/features/courses/MyCoursesFilter'
import { MyCoursesSort } from '@/components/features/courses/MyCoursesSort'
import { MyCourseCard } from '@/components/features/courses/MyCourseCard'

export const metadata: Metadata = {
  title: 'Mis cursos | NexusLMS',
  description: 'Tus cursos inscritos, progreso y calificaciones en NexusLMS.',
  openGraph: {
    title: 'Mis cursos | NexusLMS',
    description: 'Tus cursos inscritos, progreso y calificaciones en NexusLMS.',
    type: 'website',
  },
}

const VALID_STATUSES: EnrollmentStatus[] = ['ACTIVE', 'COMPLETED', 'CANCELLED']
const ITEMS_LIMIT = 50

type SortOption = 'recent' | 'progress' | 'name'

interface PageProps {
  searchParams: Promise<{ status?: string; sort?: string }>
}

function sortItems(items: UserEnrollmentItem[], sort: SortOption): UserEnrollmentItem[] {
  return [...items].sort((a, b) => {
    if (sort === 'progress') return (b.progressPercentage ?? 0) - (a.progressPercentage ?? 0)
    if (sort === 'name') return a.courseTitle.localeCompare(b.courseTitle, 'es')
    return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
  })
}

function SectionHeader({
  title,
  count,
  dotColor,
  dotShadow,
}: {
  title: string
  count: number
  dotColor: string
  dotShadow: string
}) {
  return (
    <div className="flex items-center" style={{ gap: 11 }}>
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: dotColor, boxShadow: `0 0 0 4px ${dotShadow}` }}
        aria-hidden="true"
      />
      <h2
        className="font-extrabold"
        style={{ fontSize: 17, letterSpacing: '-.01em', color: 'var(--nexus-text)' }}
      >
        {title}
      </h2>
      <span
        className="rounded-full px-[9px] py-[2px] text-[12px] font-extrabold"
        style={{ background: 'var(--nexus-progress-track)', color: 'var(--nexus-faint)' }}
      >
        {count}
      </span>
    </div>
  )
}

export default async function MyCoursesPage({ searchParams }: PageProps) {
  const params = await searchParams

  const status = VALID_STATUSES.includes(params.status as EnrollmentStatus)
    ? (params.status as EnrollmentStatus)
    : undefined

  const rawSort = params.sort
  const sort: SortOption = rawSort === 'progress' || rawSort === 'name' ? rawSort : 'recent'

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')

  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const [activeRes, completedRes, cancelledRes] = await Promise.allSettled([
    api.get<PaginatedData<UserEnrollmentItem>>(`/users/${userId}/enrollments`, {
      params: { status: 'ACTIVE', limit: ITEMS_LIMIT },
      headers,
    }),
    api.get<PaginatedData<UserEnrollmentItem>>(`/users/${userId}/enrollments`, {
      params: { status: 'COMPLETED', limit: ITEMS_LIMIT },
      headers,
    }),
    api.get<PaginatedData<UserEnrollmentItem>>(`/users/${userId}/enrollments`, {
      params: { status: 'CANCELLED', limit: ITEMS_LIMIT },
      headers,
    }),
  ])

  const rawActive = activeRes.status === 'fulfilled' ? activeRes.value.data.data : []
  const rawCompleted = completedRes.status === 'fulfilled' ? completedRes.value.data.data : []
  const rawCancelled = cancelledRes.status === 'fulfilled' ? cancelledRes.value.data.data : []

  const activeItems = sortItems(rawActive, sort)
  const completedItems = sortItems(rawCompleted, sort)
  const cancelledItems = sortItems(rawCancelled, sort)

  const counts = {
    all:
      (activeRes.status === 'fulfilled' ? activeRes.value.data.meta.total : 0) +
      (completedRes.status === 'fulfilled' ? completedRes.value.data.meta.total : 0) +
      (cancelledRes.status === 'fulfilled' ? cancelledRes.value.data.meta.total : 0),
    active: activeRes.status === 'fulfilled' ? activeRes.value.data.meta.total : 0,
    completed: completedRes.status === 'fulfilled' ? completedRes.value.data.meta.total : 0,
    cancelled: cancelledRes.status === 'fulfilled' ? cancelledRes.value.data.meta.total : 0,
  }

  const filteredItems =
    status === 'ACTIVE'
      ? activeItems
      : status === 'COMPLETED'
        ? completedItems
        : status === 'CANCELLED'
          ? cancelledItems
          : []

  return (
    <div className="flex flex-col gap-5">
      {/* Stat chips */}
      {(counts.active > 0 || counts.completed > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {counts.active > 0 && (
            <span
              className="rounded-full px-3 py-1 text-[12px] font-bold"
              style={{ background: 'var(--nexus-accent-muted)', color: 'var(--nexus-accent)' }}
            >
              {counts.active} en progreso
            </span>
          )}
          {counts.completed > 0 && (
            <span
              className="rounded-full px-3 py-1 text-[12px] font-bold"
              style={{ background: 'var(--nexus-green-bg)', color: 'var(--nexus-green)' }}
            >
              {counts.completed} completados
            </span>
          )}
        </div>
      )}

      {/* Filter + Sort row */}
      <Suspense fallback={<LoadingSpinner rows={1} />}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MyCoursesFilter counts={counts} />
          <MyCoursesSort />
        </div>
      </Suspense>

      {/* Content */}
      {!status ? (
        counts.all === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No tenés cursos inscritos"
            description="Explorá el catálogo y comenzá a aprender"
            className="border-nexus-border"
            action={{ label: 'Explorar cursos', href: '/courses' }}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {activeItems.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeader
                  title="En progreso"
                  count={counts.active}
                  dotColor="var(--nexus-accent)"
                  dotShadow="rgba(109,91,240,.13)"
                />
                <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                  {activeItems.map((item, i) => (
                    <MyCourseCard key={item.enrollmentId} item={item} index={i} />
                  ))}
                </div>
              </section>
            )}

            {completedItems.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeader
                  title="Completados"
                  count={counts.completed}
                  dotColor="var(--nexus-green)"
                  dotShadow="rgba(22,163,74,.13)"
                />
                <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                  {completedItems.map((item, i) => (
                    <MyCourseCard
                      key={item.enrollmentId}
                      item={item}
                      index={activeItems.length + i}
                    />
                  ))}
                </div>
              </section>
            )}

            {cancelledItems.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeader
                  title="Cancelados"
                  count={counts.cancelled}
                  dotColor="var(--nexus-faint)"
                  dotShadow="rgba(163,165,189,.20)"
                />
                <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                  {cancelledItems.map((item, i) => (
                    <MyCourseCard
                      key={item.enrollmentId}
                      item={item}
                      index={activeItems.length + completedItems.length + i}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={
            status === 'ACTIVE'
              ? 'No tenés cursos en progreso'
              : status === 'COMPLETED'
                ? 'No tenés cursos completados'
                : 'No tenés cursos cancelados'
          }
          description={
            status === 'ACTIVE'
              ? 'Inscribite en un curso para comenzar'
              : status === 'COMPLETED'
                ? '¡Terminá un curso para verlo acá!'
                : 'Todo en orden por acá'
          }
          className="border-nexus-border"
        />
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, i) => (
            <MyCourseCard key={item.enrollmentId} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
