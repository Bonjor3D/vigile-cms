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
import { LineHeight, Indent, FontSize, setBlockAttr } from './EditorExtensions.ts'
import { Ruler } from './Ruler.tsx'
import { ColorPickerPopup } from './ColorPickerPopup.tsx'
import { useEffect, useRef, useState, useCallback } from 'react'
import { SymbolPicker } from './SymbolPicker.tsx'

interface RichTextModalProps {
  content: string
  tag?: string
  onSave: (html: string) => void
  onClose: () => void
}

const TEXT_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre']

function wrapContent(content: string, tag: string): string {
  if (TEXT_TAGS.includes(tag) && !content.trim().startsWith('<')) {
    return `<${tag}>${content}</${tag}>`
  }
  return content
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 42, 48, 60, 72]
const LINE_HEIGHTS = ['1', '1.15', '1.5', '2', '2.5', '3']

const FONTS = [
  { value: '', label: 'Font' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
]

export function RichTextModal({ content, onSave, onClose, tag }: RichTextModalProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const savedRef = useRef(true)
  const [textColorOpen, setTextColorOpen] = useState(false)
  const [highlightOpen, setHighlightOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const [currentFont, setCurrentFont] = useState('')
  const [currentFontSize, setCurrentFontSize] = useState('')
  const [showSymbolPicker, setShowSymbolPicker] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
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
    onUpdate: () => {
      savedRef.current = false
    },
  })

  useEffect(() => {
    if (!editor) return
    const updateAttrs = () => {
      setCurrentFont(editor.getAttributes('textStyle').fontFamily || '')
      setCurrentFontSize(editor.getAttributes('fontSize').fontSize || '')
    }
    updateAttrs()
    editor.on('selectionUpdate', updateAttrs)
    editor.on('update', updateAttrs)
    return () => {
      editor.off('selectionUpdate', updateAttrs)
      editor.off('update', updateAttrs)
    }
  }, [editor])

  const handleClose = useCallback(() => {
    if (!savedRef.current) {
      setShowConfirm(true)
    } else {
      onClose()
    }
  }, [onClose])

  const handleSaveAndClose = useCallback(() => {
    if (editor) {
      onSave(editor.getHTML())
      savedRef.current = true
    }
    setShowConfirm(false)
    onClose()
  }, [editor, onSave, onClose])

  const handleDiscardAndClose = useCallback(() => {
    setShowConfirm(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (showConfirm) {
          setShowConfirm(false)
        } else {
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [handleClose, showConfirm])

  useEffect(() => {
    if (showConfirm || textColorOpen || highlightOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    setTimeout(() => window.addEventListener('mousedown', handleClickOutside), 0)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [handleClose, showConfirm, textColorOpen, highlightOpen])

  if (!editor) return null

  const setLink = () => {
    const url = window.prompt('Link URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] h-[85vh] max-w-5xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 shrink-0 rounded-t-xl">
          <h2 className="text-sm font-semibold text-gray-700">Text Editor</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" type="button" title="Close">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-200 bg-white flex-wrap shrink-0">
          <select
            value={currentFont}
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 w-28"
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value} style={f.value ? { fontFamily: f.value } : {}}>{f.label}</option>
            ))}
          </select>

          <select
            value={currentFontSize}
            onChange={(e) => {
              if (e.target.value) {
                editor.chain().focus().setFontSize(e.target.value).run()
              }
            }}
            className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 w-16"
          >
            <option value="">Size</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={String(s)}>{s}</option>
            ))}
          </select>

          <span className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label={<strong className="text-sm">B</strong>} title="Bold" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label={<em className="text-sm">I</em>} title="Italic" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label={<span className="text-sm underline">U</span>} title="Underline" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} label={<span className="text-sm line-through">S</span>} title="Strikethrough" />

          <span className="w-px h-5 bg-gray-200 mx-1" />

          <div className="relative flex items-center">
            <button
              onClick={() => setTextColorOpen((v) => !v)}
              className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-md hover:bg-gray-100 text-xs transition-colors"
              type="button"
              title="Text color"
            >
              <span className="text-sm font-bold" style={{ color: editor.getAttributes('textStyle').color || '#000000' }}>A</span>
              <span className="text-[8px] text-gray-400">▼</span>
            </button>
            {textColorOpen && (
              <ColorPickerPopup
                value={editor.getAttributes('textStyle').color || '#000000'}
                onChange={(c) => editor.chain().focus().setColor(c).run()}
                onClose={() => setTextColorOpen(false)}
              />
            )}
          </div>

          <div className="relative flex items-center">
            <button
              onClick={() => setHighlightOpen((v) => !v)}
              className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-md hover:bg-gray-100 text-xs transition-colors"
              type="button"
              title="Highlight"
            >
              <span className="text-sm" style={{ backgroundColor: editor.getAttributes('highlight').color || '#ffff00', padding: '0 2px', borderRadius: '2px' }}>A</span>
              <span className="text-[8px] text-gray-400">▼</span>
            </button>
            {highlightOpen && (
              <ColorPickerPopup
                value={editor.getAttributes('highlight').color || '#ffff00'}
                onChange={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
                onClose={() => setHighlightOpen(false)}
              />
            )}
          </div>

          <span className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} label="⬅" title="Align left" />
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} label="⬇" title="Center" />
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} label="➡" title="Align right" />
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} label="⇔" title="Justify" />

          <span className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label={<span className="text-xs">•</span>} title="Bullet list" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label={<span className="text-xs">1.</span>} title="Ordered list" />

          <span className="w-px h-5 bg-gray-200 mx-1" />

          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setBlockAttr(editor, 'lineHeight', e.target.value)
              }
            }}
            className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="">Line space</option>
            {LINE_HEIGHTS.map((lh) => (
              <option key={lh} value={lh}>{lh}</option>
            ))}
          </select>

          <span className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarBtn onClick={() => setShowSymbolPicker(true)} active={false} label={<span className="text-sm font-mono">Ω</span>} title="Insert symbol" />

          <span className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} label={<span className="text-sm">↩</span>} title="Undo" disabled={!editor.can().undo()} />
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} label={<span className="text-sm">↪</span>} title="Redo" disabled={!editor.can().redo()} />
        </div>

        <Ruler editor={editor} />

        <div className="flex-1 overflow-auto p-4">
          <EditorContent editor={editor} className="prose prose-sm max-w-none min-h-full mx-auto" />
        </div>
      </div>

      {showSymbolPicker && (
        <SymbolPicker
          onSelect={(char) => editor.chain().focus().insertContent(char).run()}
          onClose={() => setShowSymbolPicker(false)}
        />
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Save changes?</h3>
            <p className="text-xs text-gray-500">You have unsaved changes in the editor. Do you want to save them?</p>
            <div className="flex justify-end gap-2">
              <button onClick={handleDiscardAndClose} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors" type="button">
                Discard
              </button>
              <button onClick={handleSaveAndClose} className="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors" type="button">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToolbarBtn({
  onClick,
  active,
  label,
  title,
  disabled,
}: {
  onClick: () => void
  active: boolean
  label: React.ReactNode
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-1.5 py-1.5 rounded-md text-xs transition-colors ${
        active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
      type="button"
      title={title}
    >
      {label}
    </button>
  )
}
