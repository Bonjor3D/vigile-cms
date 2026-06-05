import { useState, useRef, useEffect } from 'react'
import { SymbolPicker } from './SymbolPicker.tsx'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { FontFamily } from '@tiptap/extension-font-family'
import { FontSize, LineHeight, Indent } from './EditorExtensions.ts'
import { useSettingsStore } from '../stores/settings.ts'

const TEXT_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre']

interface TextEditorProps {
  content: string
  elementId: string
  tag?: string
  onUpdate: (text: string) => void
}

function wrapContent(content: string, tag: string): string {
  if (TEXT_TAGS.includes(tag) && !content.trim().startsWith('<')) {
    return `<${tag}>${content}</${tag}>`
  }
  return content
}

export function TextEditor({ content, elementId, tag, onUpdate }: TextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      ImageExtension,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
      LineHeight,
      Indent,
    ],
    content: tag ? wrapContent(content, tag) : content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
  })

  const [showSymbolPicker, setShowSymbolPicker] = useState(false)

  if (!editor) return null

  const setLink = () => {
    const url = window.prompt('Link URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div>
      <div className="flex items-center gap-0.5 p-1 border-b bg-gray-50 rounded-t flex-wrap">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label={<strong className="text-xs">B</strong>} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label={<em className="text-xs">I</em>} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label={<span className="text-xs underline">U</span>} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} label={<span className="text-xs line-through">S</span>} />

        <span className="w-px h-4 bg-gray-200 mx-0.5" />

        <ThemeVarBtn
          onSelect={(name) => editor.chain().focus().setColor(`var(--${name})`).run()}
        />

        <input
          type="color"
          value={editor.getAttributes('textStyle').color || '#000000'}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="w-5 h-5 rounded cursor-pointer p-0.5 border border-gray-200"
          title="Text color"
        />

        <ThemeVarBtn
          onSelect={(name) => editor.chain().focus().toggleHighlight({ color: `var(--${name})` }).run()}
        />

        <input
          type="color"
          value={editor.getAttributes('highlight').color || '#ffff00'}
          onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          className="w-5 h-5 rounded cursor-pointer p-0.5 border border-gray-200"
          title="Highlight"
        />

        <input
          type="color"
          value={editor.getAttributes('highlight').color || '#ffff00'}
          onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          className="w-5 h-5 rounded cursor-pointer p-0.5 border border-gray-200"
          title="Highlight"
        />

        <span className="w-px h-4 bg-gray-200 mx-0.5" />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} label="⬅" />
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} label="⬇" />
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} label="➡" />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label={<span className="text-xs">•</span>} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label={<span className="text-xs">1.</span>} />

        <ToolbarBtn onClick={setLink} active={editor.isActive('link')} label={<span className="text-xs">🔗</span>} />
        <ToolbarBtn onClick={() => setShowSymbolPicker(true)} active={false} label={<span className="text-xs font-mono">Ω</span>} />
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-2" />

      {showSymbolPicker && (
        <SymbolPicker
          onSelect={(char) => editor.chain().focus().insertContent(char).run()}
          onClose={() => setShowSymbolPicker(false)}
        />
      )}
    </div>
  )
}

function ToolbarBtn({
  onClick,
  active,
  label,
}: {
  onClick: () => void
  active: boolean
  label: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-1.5 py-0.5 rounded text-xs ${active ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
      type="button"
    >
      {label}
    </button>
  )
}

function ThemeVarBtn({ onSelect }: { onSelect: (name: string) => void }) {
  const themeVars = useSettingsStore((s) => s.themeVars)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    setTimeout(() => document.addEventListener('mousedown', handle), 0)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  if (themeVars.length === 0) return null

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="px-1 py-0.5 rounded text-xs text-gray-400 hover:text-indigo-500 hover:bg-gray-100 transition-colors"
        type="button"
        title="Insert theme variable"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 max-h-36 overflow-auto">
          {themeVars.map((v) => (
            <button
              key={v.name}
              onClick={() => { onSelect(v.name); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50 transition-colors"
              type="button"
            >
              <span className="font-mono">--{v.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
