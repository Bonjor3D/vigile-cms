import { useState } from 'react'
import { useEditorStore } from '../stores/editor.ts'
import type { ComponentNode } from '../types/component.ts'

interface ImageSystemProps {
  elementId: string
}

export function ImageSettings({ elementId }: ImageSystemProps) {
  const { currentPage, updateElement } = useEditorStore()
  const [uploading, setUploading] = useState(false)

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

  const node = currentPage ? findNode(elementId, currentPage.root) : null
  if (!node || node.tag !== 'img') return null

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        updateElement(elementId, { src: data.url })
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase">Image</h3>

      <div>
        <label className="text-xs block mb-1">Source URL</label>
        <input
          type="text"
          value={node.src || ''}
          onChange={(e) => updateElement(elementId, { src: e.target.value })}
          className="w-full px-2 py-1 border rounded text-xs"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="text-xs block mb-1">Alt Text</label>
        <input
          type="text"
          value={node.alt || ''}
          onChange={(e) => updateElement(elementId, { alt: e.target.value })}
          className="w-full px-2 py-1 border rounded text-xs"
        />
      </div>

      <div>
        <label className="text-xs block mb-1">Upload</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="text-xs"
          disabled={uploading}
        />
        {uploading && <p className="text-xs text-indigo-500 mt-1">Uploading...</p>}
      </div>

      {node.src && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">Preview</p>
          <img src={node.src} alt={node.alt || ''} className="max-w-full h-auto border rounded" style={{ maxHeight: '200px' }} />
        </div>
      )}
    </div>
  )
}
