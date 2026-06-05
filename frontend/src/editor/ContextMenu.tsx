import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../stores/editor.ts'
import { useTemplateStore } from '../stores/template.ts'
import type { ComponentNode } from '../types/component.ts'

interface ContextMenuProps {
  x: number
  y: number
  elementId: string
  onClose: () => void
}

export function ContextMenu({ x, y, elementId, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [naming, setNaming] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const { currentPage, selectedElementId, deleteElement, duplicateElement, clipboardNode, copyNode, pasteNode, updateElement } = useEditorStore()
  const { add: addTemplate } = useTemplateStore()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => window.addEventListener('mousedown', handler), 0)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  const findNodeById = (id: string, node?: ComponentNode): ComponentNode | null => {
    if (!node) return null
    if (node.id === id) return node
    if (node.children) {
      for (const c of node.children) {
        const found = findNodeById(id, c)
        if (found) return found
      }
    }
    return null
  }

  const node = currentPage ? findNodeById(elementId, currentPage.root) : null
  if (!node) return null

  const menuX = Math.min(x, window.innerWidth - 180)
  const menuY = Math.min(y, window.innerHeight - 240)

  const handleCopy = () => {
    if (node) copyNode(node)
    onClose()
  }

  const handlePaste = () => {
    pasteNode()
    onClose()
  }

  const handleDuplicate = () => {
    duplicateElement(elementId)
    onClose()
  }

  const handleToggleEmpty = () => {
    updateElement(elementId, { empty: !node.empty })
    onClose()
  }

  const handleDelete = () => {
    if (currentPage?.root.id !== elementId) deleteElement(elementId)
    onClose()
  }

  const handleSaveTemplate = () => {
    setNaming(true)
  }

  const handleConfirmTemplate = () => {
    if (templateName.trim() && node) addTemplate(templateName.trim(), node)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 text-xs"
      style={{ left: menuX, top: menuY }}
    >
      {naming ? (
        <div className="p-2 space-y-2">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name"
            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-indigo-400"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmTemplate(); if (e.key === 'Escape') onClose() }}
          />
          <div className="flex gap-1">
            <button onClick={handleConfirmTemplate} className="flex-1 px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-[10px]" type="button">Save</button>
            <button onClick={onClose} className="px-2 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 text-[10px]" type="button">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <MenuItem onClick={handleCopy}>Copy</MenuItem>
          <MenuItem onClick={handlePaste} disabled={!clipboardNode}>Paste</MenuItem>
          <MenuItem onClick={handleDuplicate}>Duplicate</MenuItem>
          <MenuItem onClick={handleToggleEmpty}>{node.empty ? 'Mark Non-empty' : 'Mark Empty'}</MenuItem>
          <MenuItem onClick={handleDelete} disabled={currentPage?.root.id === elementId}>Delete</MenuItem>
          {node.tag === 'div' && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <MenuItem onClick={handleSaveTemplate}>Save as Template</MenuItem>
            </>
          )}
        </>
      )}
    </div>
  )
}

function MenuItem({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-1.5 transition-colors ${
        disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
      }`}
      type="button"
    >
      {children}
    </button>
  )
}
