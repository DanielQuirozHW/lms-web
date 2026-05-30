'use client'

import { useState } from 'react'
import { GraduationCap, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { Certificate } from '@/types/models'

interface CertificateCardProps {
  certificate: Certificate
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    setIsDownloading(true)
    try {
      // Fetch as blob via the axios instance (auth header is applied automatically)
      const response = await api.get<Blob>(
        `/certificates/${certificate.certificateCode}/download`,
        { responseType: 'blob' }
      )
      const blob = response.data
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `certificado-${certificate.certificateCode}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('No se pudo descargar el certificado. Intentá de nuevo.')
    } finally {
      setIsDownloading(false)
    }
  }

  const instructorName = `${certificate.instructor.firstName} ${certificate.instructor.lastName}`

  return (
    <div className="border-nexus-border bg-nexus-card flex flex-col gap-4 rounded-xl border p-5">
      {/* Icon + course title */}
      <div className="flex items-start gap-3">
        <div className="bg-nexus-success/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <GraduationCap className="text-nexus-success h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-nexus-text line-clamp-2 text-sm leading-snug font-semibold">
            {certificate.course.title}
          </h3>
          <p className="text-nexus-muted mt-0.5 truncate text-xs">Por {instructorName}</p>
        </div>
      </div>

      {/* Details */}
      <dl className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-nexus-muted">Emitido el</dt>
          <dd className="text-nexus-text font-medium">{formatDate(certificate.issuedAt)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-nexus-muted">Calificación</dt>
          <dd className="text-nexus-text font-medium">
            {certificate.finalGrade !== null ? `${certificate.finalGrade}%` : '—'}
          </dd>
        </div>
      </dl>

      {/* Download button */}
      <Button
        size="sm"
        onClick={handleDownload}
        disabled={isDownloading}
        className="bg-nexus-accent hover:bg-nexus-accent-hover w-full text-white"
      >
        {isDownloading ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Descargando...
          </>
        ) : (
          <>
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Descargar PDF
          </>
        )}
      </Button>

      {/* Certificate code */}
      <p className="text-nexus-muted text-center font-mono text-[10px] tracking-widest">
        {certificate.certificateCode}
      </p>
    </div>
  )
}
