'use client'

import { useRef, useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TiptapImage from '@tiptap/extension-image'
import TiptapLink from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { createLowlight, common } from 'lowlight'
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link,
  Terminal,
} from 'lucide-react'
import { PROSE_STYLES } from '@/components/features/lessons/RichTextRenderer'
import { cn } from '@/lib/utils'

const lowlight = createLowlight(common)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countWords(html: string): number {
  return html
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200))
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

const TBTN = cn(
  'flex h-7 w-7 items-center justify-center rounded-lg text-nexus-muted transition-colors',
  'hover:bg-nexus-nav-hover hover:text-nexus-nav-hover-fg',
  'aria-pressed:bg-nexus-accent-muted aria-pressed:text-nexus-accent'
)

function TBtn({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active ?? false}
      aria-label={label}
      className={TBTN}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="bg-nexus-border mx-1 h-5 w-px shrink-0" aria-hidden="true" />
}

function Toolbar({ editor }: { editor: Editor }) {
  function handleLink() {
    const url = window.prompt('URL del enlace:')
    if (!url || !/^https?:\/\//i.test(url)) return
    editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
  }

  function handleImage() {
    const url = window.prompt('URL de la imagen:')
    if (!url || !/^https?:\/\//i.test(url)) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="border-nexus-border bg-nexus-card flex flex-wrap items-center gap-0.5 border-b px-3 py-2">
      <TBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        label="Encabezado 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        label="Encabezado 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        label="Encabezado 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </TBtn>
      <Sep />
      <TBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        label="Negrita"
      >
        <Bold className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        label="Cursiva"
      >
        <Italic className="h-3.5 w-3.5" />
      </TBtn>
      <Sep />
      <TBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        label="Código en línea"
      >
        <Code className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        label="Bloque de código"
      >
        <Terminal className="h-3.5 w-3.5" />
      </TBtn>
      <Sep />
      <TBtn onClick={handleLink} active={editor.isActive('link')} label="Enlace">
        <Link className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn onClick={handleImage} active={false} label="Imagen">
        <ImageIcon className="h-3.5 w-3.5" />
      </TBtn>
    </div>
  )
}

// ─── RichTextEditor ───────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value?: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'javascript' }),
      TiptapImage.configure({ HTMLAttributes: { class: 'rounded-xl max-w-full my-4' } }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', class: 'text-nexus-accent underline' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Escribe el contenido de la lección…',
      }),
    ],
    content: value,
    editorProps: {
      attributes: { class: 'outline-none min-h-[400px] px-5 py-4' },
    },
    onUpdate({ editor: e }) {
      onChangeRef.current(e.getHTML())
    },
  })

  if (!editor) {
    return (
      <div className={cn('border-nexus-border overflow-hidden rounded-xl border', className)}>
        <div className="border-nexus-border bg-nexus-card h-10 border-b" />
        <div className="bg-nexus-surface min-h-[400px]" />
        <div className="border-nexus-border bg-nexus-card h-9 border-t" />
      </div>
    )
  }

  const html = editor.getHTML()
  const wordCount = countWords(html)
  const readingTime = estimateReadingTime(wordCount)

  return (
    <div className={cn('border-nexus-border overflow-hidden rounded-xl border', className)}>
      <Toolbar editor={editor} />
      <div className={cn('bg-nexus-surface', PROSE_STYLES)}>
        <EditorContent editor={editor} />
      </div>
      <div className="border-nexus-border bg-nexus-card flex items-center justify-between border-t px-4 py-2">
        <span className="text-nexus-faint text-xs">{wordCount} palabras</span>
        <span className="text-nexus-faint text-xs">~{readingTime} min de lectura</span>
      </div>
    </div>
  )
}
