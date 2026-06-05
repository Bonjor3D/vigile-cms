import { useState, useRef, useEffect, useCallback } from 'react'
import { NodePalette } from './NodePalette.tsx'
import { NodeWorkspace } from './NodeWorkspace.tsx'
import { NodeCodePanel } from './NodeCodePanel.tsx'
import { useNodeEditorStore } from './stores/nodeEditorStore.ts'
import type { CompiledCode } from './nodes/nodeDefinitions.ts'
import { compileCSS } from './nodes/cssCompiler.ts'
import { compileJS } from './nodes/jsCompiler.ts'
import { useSettingsStore } from '../stores/settings.ts'

interface NodeEditorModalProps {
  onClose: () => void
}

export function NodeEditorModal({ onClose }: NodeEditorModalProps) {
  const {
    files, activeFileId, setActiveFile,
    addFile, removeFile, renameFile,
    showCodePanel, setShowCodePanel,
    getCompilableNodes, loadFiles, serializeFiles,
  } = useNodeEditorStore()
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const [compiled, setCompiled] = useState<CompiledCode>({ css: '', js: '' })
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  useEffect(() => {
    const { nodes: cssNodes, connections: cssConns } = getCompilableNodes('css')
    const { nodes: jsNodes, connections: jsConns } = getCompilableNodes('js')
    const css = compileCSS(cssNodes, cssConns)
    const js = compileJS(jsNodes, jsConns)
    setCompiled({ css, js })
  }, [files, getCompilableNodes])

  const handleSave = useCallback(async () => {
    serializeFiles()
    await updateSettings({ globalCss: compiled.css, globalJs: compiled.js })
    onClose()
  }, [compiled, updateSettings, onClose, serializeFiles])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose, handleSave])

  const activeFile = files.find((f) => f.id === activeFileId)

  const handleAddFile = () => {
    const name = window.prompt('File name:')
    if (!name) return
    const category = window.confirm('OK = CSS, Cancel = JS') ? 'css' : 'js'
    addFile(name, category)
  }

  const handleRemoveFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (files.length <= 1) return
    if (window.confirm('Delete this file?')) removeFile(id)
  }

  const handleDoubleClick = (id: string, name: string) => {
    setEditingFileId(id)
    setEditName(name)
    setTimeout(() => renameInputRef.current?.select(), 50)
  }

  const handleRenameSubmit = () => {
    if (editingFileId && editName.trim()) renameFile(editingFileId, editName.trim())
    setEditingFileId(null)
  }

  const cssFiles = files.filter((f) => f.category === 'css').length
  const jsFiles = files.filter((f) => f.category === 'js').length

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-gray-700 shrink-0">Node Editor</h2>
          <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
          <div className="flex items-center gap-1 overflow-x-auto max-w-[60vw] scrollbar-thin">
            {files.map((f) => {
              const isActive = f.id === activeFileId
              const dotColor = f.category === 'css' ? 'bg-blue-500' : 'bg-amber-500'
              return (
                <div
                  key={f.id}
                  onClick={() => setActiveFile(f.id)}
                  className={`group flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md cursor-pointer whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-white text-gray-800 shadow-sm font-medium border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                  onDoubleClick={() => handleDoubleClick(f.id, f.name)}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                  {editingFileId === f.id ? (
                    <input
                      ref={renameInputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleRenameSubmit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit()
                        if (e.key === 'Escape') setEditingFileId(null)
                      }}
                      className="w-20 px-1 py-0 text-xs border border-indigo-300 rounded outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span>{f.name}</span>
                  )}
                  {files.length > 1 && (
                    <button
                      onClick={(e) => handleRemoveFile(e, f.id)}
                      className="p-0.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
            <button
              onClick={handleAddFile}
              className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
              title="Add file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            <span className="text-blue-500">{cssFiles}</span> CSS · <span className="text-amber-500">{jsFiles}</span> JS
          </span>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button
            onClick={() => setShowCodePanel(!showCodePanel)}
            className="px-2.5 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {showCodePanel ? '◀ Code' : '▶ Code'}
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-xs bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 rounded text-gray-400"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {activeFile && (
        <div className="flex flex-1 overflow-hidden">
          <NodePalette />
          <NodeWorkspace />
          {showCodePanel && <NodeCodePanel compiled={compiled} />}
        </div>
      )}
    </div>
  )
}
