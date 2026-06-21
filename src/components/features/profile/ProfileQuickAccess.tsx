'use client'

import Link from 'next/link'
import { BookOpen, Bookmark, Award, ArrowRight } from 'lucide-react'
import { useMyEnrollments } from '@/hooks/queries/users'
import { useBookmarks } from '@/hooks/queries/bookmarks'
import { useCertificates } from '@/hooks/queries/certificates'

export function ProfileQuickAccess() {
  const { data: enrollmentsData } = useMyEnrollments()
  const { data: bookmarksData } = useBookmarks(1, 1)
  const { data: certificates } = useCertificates()

  const activeCount = enrollmentsData?.data.filter((e) => e.status === 'ACTIVE').length ?? 0
  const bookmarkCount = bookmarksData?.meta.total ?? 0
  const certCount = certificates?.length ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--nexus-text)', margin: '0 2px' }}>
        Accesos rápidos
      </div>

      {/* Mis cursos */}
      <Link
        href="/my-courses"
        className="group flex items-center gap-4 rounded-[16px] border p-[18px] no-underline transition-all duration-150 hover:-translate-y-0.5"
        style={{
          background: 'var(--nexus-card)',
          border: '1px solid var(--nexus-border)',
          boxShadow: 'var(--nexus-card-shadow)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--nexus-accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--nexus-border)'
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            flexShrink: 0,
            background: 'var(--chip-0-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BookOpen
            style={{ width: 23, height: 23, color: 'var(--chip-0-color)' }}
            aria-hidden="true"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--nexus-text)' }}>
              Mis cursos
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--chip-0-color)',
                background: 'var(--chip-0-bg)',
                padding: '2px 9px',
                borderRadius: 99,
              }}
            >
              {activeCount} activos
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--nexus-faint)', marginTop: 3 }}>
            Retomá donde lo dejaste
          </div>
        </div>
        <span
          style={{ display: 'flex', color: 'var(--nexus-faint)' }}
          className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--nexus-accent)]"
        >
          <ArrowRight
            style={{ width: 20, height: 20, display: 'block', flexShrink: 0 }}
            aria-hidden="true"
          />
        </span>
      </Link>

      {/* Guardados */}
      <Link
        href="/bookmarks"
        className="group flex items-center gap-4 rounded-[16px] border p-[18px] no-underline transition-all duration-150 hover:-translate-y-0.5"
        style={{
          background: 'var(--nexus-card)',
          border: '1px solid var(--nexus-border)',
          boxShadow: 'var(--nexus-card-shadow)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--nexus-accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--nexus-border)'
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            flexShrink: 0,
            background: 'var(--chip-2-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bookmark
            style={{ width: 23, height: 23, color: 'var(--chip-2-color)' }}
            aria-hidden="true"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--nexus-text)' }}>
              Guardados
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--chip-2-color)',
                background: 'var(--chip-2-bg)',
                padding: '2px 9px',
                borderRadius: 99,
              }}
            >
              {bookmarkCount}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--nexus-faint)', marginTop: 3 }}>
            Cursos que querés hacer
          </div>
        </div>
        <span
          style={{ display: 'flex', color: 'var(--nexus-faint)' }}
          className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--nexus-accent)]"
        >
          <ArrowRight
            style={{ width: 20, height: 20, display: 'block', flexShrink: 0 }}
            aria-hidden="true"
          />
        </span>
      </Link>

      {/* Certificados */}
      <Link
        href="/certificates"
        className="group flex items-center gap-4 rounded-[16px] border p-[18px] no-underline transition-all duration-150 hover:-translate-y-0.5"
        style={{
          background: 'var(--nexus-card)',
          border: '1px solid var(--nexus-border)',
          boxShadow: 'var(--nexus-card-shadow)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--nexus-accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--nexus-border)'
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            flexShrink: 0,
            background: 'var(--chip-1-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Award
            style={{ width: 23, height: 23, color: 'var(--chip-1-color)' }}
            aria-hidden="true"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--nexus-text)' }}>
              Certificados
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--chip-1-color)',
                background: 'var(--chip-1-bg)',
                padding: '2px 9px',
                borderRadius: 99,
              }}
            >
              {certCount}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--nexus-faint)', marginTop: 3 }}>
            Tus logros obtenidos
          </div>
        </div>
        <span
          style={{ display: 'flex', color: 'var(--nexus-faint)' }}
          className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--nexus-accent)]"
        >
          <ArrowRight
            style={{ width: 20, height: 20, display: 'block', flexShrink: 0 }}
            aria-hidden="true"
          />
        </span>
      </Link>
    </div>
  )
}
