'use client'

import { useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { createLowlight, common } from 'lowlight'
import { sanitize } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

const lowlight = createLowlight(common)

// Minimal hast serializer — lowlight output is span-only; no XSS risk
type HastText = { type: 'text'; value: string }
type HastElement = {
  type: 'element'
  tagName: string
  properties: Record<string, unknown>
  children: (HastText | HastElement)[]
}
type HastNode = HastText | HastElement

function hastToHtml(nodes: HastNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') {
        return n.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }
      if (n.type === 'element') {
        const cls = (n.properties.className as string[] | undefined)?.join(' ') ?? ''
        const attr = cls ? ` class="${cls}"` : ''
        return `<span${attr}>${hastToHtml(n.children)}</span>`
      }
      return ''
    })
    .join('')
}

function estimateReadingTime(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export const PROSE_STYLES = cn(
  'max-w-none text-nexus-text',
  '[&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-nexus-text',
  '[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-nexus-text',
  '[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-nexus-text',
  '[&_p]:mb-4 [&_p]:leading-relaxed',
  '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:mb-1 [&_li]:leading-relaxed',
  '[&_code]:rounded [&_code]:bg-nexus-card [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_code]:text-nexus-accent',
  '[&_pre]:relative [&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#0d1117] [&_pre]:p-4 [&_pre]:pt-10',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[#e6edf3] [&_pre_code]:text-nexus-accent-0',
  '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-nexus-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-nexus-muted',
  '[&_a]:text-nexus-accent [&_a]:underline [&_a:hover]:text-nexus-accent-hover',
  '[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl',
  '[&_hr]:my-6 [&_hr]:border-nexus-border',
  '[&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse',
  '[&_th]:border [&_th]:border-nexus-border [&_th]:bg-nexus-card [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold',
  '[&_td]:border [&_td]:border-nexus-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm'
)

interface RichTextRendererProps {
  content: string
  className?: string
}

export function RichTextRenderer({ content, className }: RichTextRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // sanitize() uses DOMPurify client-side — MISTAKES.md [009]
  const safeHtml = sanitize(content)
  const readingTime = estimateReadingTime(content)
  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.querySelectorAll<HTMLElement>('pre code').forEach((code) => {
      const pre = code.parentElement
      if (!pre) return

      // Apply lowlight syntax highlighting
      const lang = [...code.classList]
        .find((c) => c.startsWith('language-'))
        ?.replace('language-', '')
      if (lang && lowlight.registered(lang)) {
        try {
          const result = lowlight.highlight(lang, code.textContent ?? '')
          // Safe: lowlight output contains only span elements with class attributes
          code.innerHTML = hastToHtml(result.children as unknown as HastNode[])
        } catch {
          // leave raw code if highlighting fails
        }
      }

      // Add copy button via vanilla DOM (no setState — MISTAKES.md / React Compiler)
      if (pre.querySelector('[data-copy-btn]')) return
      const btn = document.createElement('button')
      btn.setAttribute('data-copy-btn', 'true')
      btn.setAttribute('aria-label', 'Copiar código')
      btn.textContent = 'Copiar'
      btn.style.cssText = [
        'position:absolute',
        'top:8px',
        'right:10px',
        'padding:2px 10px',
        'border-radius:6px',
        'border:1px solid rgba(255,255,255,0.15)',
        'background:rgba(255,255,255,0.08)',
        'color:rgba(255,255,255,0.6)',
        'font-size:11px',
        'font-family:inherit',
        'font-weight:500',
        'cursor:pointer',
        'transition:background 150ms',
        'z-index:1',
      ].join(';')
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(255,255,255,0.15)'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(255,255,255,0.08)'
      })
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(code.textContent ?? '').catch(() => {})
        btn.textContent = '¡Copiado!'
        setTimeout(() => {
          btn.textContent = 'Copiar'
        }, 2000)
      })
      pre.appendChild(btn)
    })
  }, [safeHtml])

  return (
    <div className={className}>
      {/* Reading time badge */}
      <div className="mb-5 flex items-center gap-1.5">
        <Clock className="text-nexus-muted h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-nexus-muted text-xs font-medium">{readingTime} min de lectura</span>
      </div>

      {isHtml ? (
        <div ref={containerRef}>
          {/* eslint-disable-next-line react/no-danger */}
          <article className={PROSE_STYLES} dangerouslySetInnerHTML={{ __html: safeHtml }} />
        </div>
      ) : (
        <article className={cn(PROSE_STYLES, 'whitespace-pre-wrap')}>{content}</article>
      )}
    </div>
  )
}
