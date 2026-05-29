import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BookOpen, CheckCircle2, Award, Users, Star, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'NexusLMS — Aprendé sin límites',
  description:
    'Plataforma de aprendizaje online con cursos en video, evaluaciones interactivas y certificados reconocidos por la industria.',
  openGraph: {
    title: 'NexusLMS — Aprendé sin límites',
    description: 'Más de 500 cursos, 10.000 estudiantes y 98% de satisfacción.',
    type: 'website',
  },
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function NexusLogoSvg({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M14 1.5L25.5 8v14L14 28.5 2.5 22V8L14 1.5z" fill="#4A7FD4" />
      <path d="M14 7.5l8.5 4.9V18L14 23l-8.5-4.9v-5.6L14 7.5z" fill="white" fillOpacity="0.18" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const session = await auth()
  if (session && session.error !== 'RefreshTokenExpired') redirect('/dashboard')

  return (
    <div className="bg-nexus-bg text-nexus-text min-h-screen">
      {/* Nav */}
      <nav className="border-nexus-border bg-nexus-bg/95 sticky top-0 z-30 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <NexusLogoSvg size={28} />
            <span className="text-base font-bold tracking-tight">
              Nexus<span className="text-nexus-accent">LMS</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-nexus-muted hover:text-nexus-text text-sm font-medium transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="bg-nexus-accent hover:bg-nexus-accent-hover rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mb-6 flex justify-center">
          <NexusLogoSvg size={64} />
        </div>
        <h1 className="text-nexus-text mb-4 text-5xl leading-tight font-bold tracking-tight md:text-6xl">
          Aprendé <span className="text-nexus-accent">sin límites</span>
        </h1>
        <p className="text-nexus-muted mx-auto mb-10 max-w-xl text-lg leading-relaxed">
          Accedé a cientos de cursos con instructores expertos, evaluaciones interactivas y
          certificados reconocidos por la industria.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/courses"
            className="bg-nexus-accent hover:bg-nexus-accent-hover flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-colors"
          >
            Explorar cursos
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/register"
            className="border-nexus-border bg-nexus-card text-nexus-text hover:border-nexus-accent rounded-xl border px-8 py-3 text-sm font-semibold transition-colors"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-nexus-card py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-nexus-text mb-2 text-center text-3xl font-bold">
            Todo lo que necesitás para aprender
          </h2>
          <p className="text-nexus-muted mb-12 text-center">
            Una plataforma completa diseñada para estudiantes e instructores
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: 'Cursos en video',
                description:
                  'Videos de alta calidad con controles de velocidad, subtítulos y acceso de por vida.',
              },
              {
                icon: CheckCircle2,
                title: 'Evaluaciones interactivas',
                description:
                  'Quizzes, tareas y proyectos que refuerzan el aprendizaje y dan retroalimentación inmediata.',
              },
              {
                icon: Award,
                title: 'Certificados',
                description:
                  'Certificados verificables al completar cursos, reconocidos por empresas líderes.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="border-nexus-border bg-nexus-bg rounded-2xl border p-6">
                <div className="bg-nexus-accent/15 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Icon className="text-nexus-accent h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-nexus-text mb-2 text-base font-semibold">{title}</h3>
                <p className="text-nexus-muted text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: '500+', label: 'Cursos disponibles', icon: BookOpen },
              { value: '10.000+', label: 'Estudiantes activos', icon: Users },
              { value: '98%', label: 'Tasa de satisfacción', icon: Star },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="border-nexus-border bg-nexus-card rounded-2xl border p-6">
                <Icon className="text-nexus-accent mx-auto mb-2 h-6 w-6" aria-hidden="true" />
                <p className="text-nexus-text text-3xl font-bold">{value}</p>
                <p className="text-nexus-muted mt-1 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="border-nexus-accent/30 bg-nexus-accent/10 rounded-2xl border px-8 py-12">
            <h2 className="text-nexus-text mb-3 text-3xl font-bold">¿Listo para empezar?</h2>
            <p className="text-nexus-muted mb-8">
              Sumate a miles de estudiantes que ya están aprendiendo con NexusLMS.
            </p>
            <Link
              href="/register"
              className="bg-nexus-accent hover:bg-nexus-accent-hover inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-colors"
            >
              Registrate gratis
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-nexus-border border-t py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <NexusLogoSvg size={20} />
            <span className="text-nexus-text text-sm font-semibold">
              Nexus<span className="text-nexus-accent">LMS</span>
            </span>
          </div>
          <p className="text-nexus-muted text-xs">
            © {new Date().getFullYear()} NexusLMS. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
