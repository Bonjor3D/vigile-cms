import { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../stores/editor.ts'
import { usePageStore } from '../stores/page.ts'
import { useSettingsStore } from '../stores/settings.ts'
import { useHistoryStore } from '../stores/history.ts'
import { FileBrowser } from './FileBrowser.tsx'
import { NodeEditorModal } from './NodeEditorModal.tsx'
import { VIEWPORT_PRESETS } from './ViewportPresets.ts'

export function EditHeader() {
  const { isEditMode, toggleEditMode, currentPage, editMode, setEditTarget, breakpoint, setBreakpoint, selectedElementId, deleteElement, duplicateElement, setCurrentPage, viewportWidth, viewportHeight, setViewportSize } = useEditorStore()
  const { savePage } = usePageStore()
  const { saveHeader, saveFooter, saveElement } = useSettingsStore()
  const { undo, redo, past, future } = useHistoryStore()

  const handleSave = async () => {
    if (!currentPage) return
    if (currentPage.slug === 'header') {
      await saveHeader(currentPage.root)
    } else if (currentPage.slug === 'footer') {
      await saveFooter(currentPage.root)
    } else if (currentPage.slug?.startsWith('element-')) {
      saveElement(currentPage.slug.slice(8), currentPage.root)
    } else {
      await savePage(currentPage)
    }
  }

  const [showFiles, setShowFiles] = useState(false)
  const [showNodeEditor, setShowNodeEditor] = useState(false)

  const handleUndo = () => {
    const snapshot = undo()
    if (snapshot && currentPage) setCurrentPage({ ...currentPage, root: snapshot })
  }

  const handleRedo = () => {
    const snapshot = redo()
    if (snapshot && currentPage) setCurrentPage({ ...currentPage, root: snapshot })
  }

  return (
    <header className="h-11 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-bold text-sm text-indigo-600">Vigile</span>
        {isEditMode && currentPage && (
          <input
            type="text"
            value={currentPage.title}
            onChange={(e) => setCurrentPage({ ...currentPage, title: e.target.value })}
            className="text-sm px-2 py-1 rounded border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors w-44"
          />
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {isEditMode && (
          <>
            {!currentPage?.slug?.startsWith('element-') && (
              <>
                <select
                  value={editMode}
                  onChange={(e) => setEditTarget(e.target.value as 'page' | 'header' | 'footer')}
                  className="text-xs px-2 py-1.5 rounded border border-gray-200 bg-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="page">Page</option>
                  <option value="header">Header</option>
                  <option value="footer">Footer</option>
                </select>
                <div className="w-px h-5 bg-gray-200 mx-1" />
              </>
            )}

            <div className="flex rounded border border-gray-200 overflow-hidden text-xs">
              {(['desktop', 'tablet', 'mobile'] as const).map((bp) => (
                <button
                  key={bp}
                  onClick={() => setBreakpoint(bp)}
                  className={`px-2 py-1 transition-colors ${
                    breakpoint === bp
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {bp === 'desktop' ? 'D' : bp === 'tablet' ? 'T' : 'M'}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            <ViewportDropdown
              presets={VIEWPORT_PRESETS[breakpoint]}
              width={viewportWidth}
              height={viewportHeight}
              onChange={(w, h) => setViewportSize(w, h)}
            />

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {selectedElementId && (
              <>
                <button
                  onClick={() => duplicateElement(selectedElementId)}
                  className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  title="Duplicate (Ctrl+D)"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => deleteElement(selectedElementId)}
                  className="px-2 py-1 text-xs rounded border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                  title="Delete (Delete)"
                >
                  Delete
                </button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
              </>
            )}

            <button
              onClick={handleUndo}
              disabled={past.length === 0}
              className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={future.length === 0}
              className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              Redo
            </button>

            <button
              onClick={() => setShowNodeEditor(true)}
              className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              title="Global Scripts (Node Editor)"
            >
              Scripts
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />

            <button
              onClick={() => setShowFiles(true)}
              className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              title="File Browser"
            >
              Files
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs font-medium bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Save
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1" />
          </>
        )}

        <button
          onClick={toggleEditMode}
          className={`px-3 py-1 text-xs rounded border font-medium transition-colors ${
            isEditMode
              ? 'bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600'
              : 'border-indigo-500 text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          {isEditMode ? 'Exit Edit' : 'Edit'}
        </button>
      </div>

      {showFiles && <FileBrowser onClose={() => setShowFiles(false)} />}

      {showNodeEditor && (
        <NodeEditorModal
          onClose={() => setShowNodeEditor(false)}
        />
      )}
    </header>
  )
}

interface ViewportDropdownProps {
  presets: { label: string; width: number; height: number }[]
  width: number
  height: number
  onChange: (w: number, h: number) => void
}

function ViewportDropdown({ presets, width, height, onChange }: ViewportDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const current = presets.find(p => p.width === width && p.height === height)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors min-w-[100px]"
      >
        <span className="font-medium">{current?.label ?? 'Custom'}</span>
        <span className="text-gray-400 ml-auto">{width}×{height}</span>
        <svg className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => { onChange(p.width, p.height); setOpen(false) }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                p.width === width && p.height === height ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">{p.label}</span>
              <span className="text-gray-400">{p.width}×{p.height}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
