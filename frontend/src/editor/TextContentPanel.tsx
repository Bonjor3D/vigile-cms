import { useState, useMemo } from 'react'
import { useEditorStore } from '../stores/editor.ts'
import { TextEditor } from './TextEditor.tsx'
import { RichTextModal } from './RichTextModal.tsx'
import type { ComponentNode } from '../types/component.ts'

function findNode(id: string, node: ComponentNode): ComponentNode | null {
  if (node.id === id) return node
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(id, child)
      if (found) return found
    }
  }
  return null
}

interface TextContentPanelProps {
  elementId: string
}

export function TextContentPanel({ elementId }: TextContentPanelProps) {
  const { currentPage, updateElement } = useEditorStore()
  const [showModal, setShowModal] = useState(false)

  const node = useMemo(
    () => currentPage ? findNode(elementId, currentPage.root) : null,
    [currentPage, elementId]
  )

  if (!node) return <div className="text-xs text-gray-400 p-4">Select an element</div>

  const content = node.text || ''

  const handleUpdate = (text: string) => {
    updateElement(elementId, { text })
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Content</h3>
        <button
          onClick={() => setShowModal(true)}
          className="text-[11px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 border border-indigo-200 transition-colors"
          type="button"
        >
          Open full editor
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <TextEditor content={content} elementId={elementId} tag={node.tag} onUpdate={handleUpdate} />
      </div>

      {showModal && (
        <RichTextModal
          content={content}
          tag={node.tag}
          onSave={handleUpdate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
