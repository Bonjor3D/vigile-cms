import { useState } from 'react'
import { useEditorStore } from '../stores/editor.ts'
import type { ComponentNode } from '../types/component.ts'
import { FileBrowser } from './FileBrowser.tsx'

interface MediaSettingsProps {
  elementId: string
}

export function MediaSettings({ elementId }: MediaSettingsProps) {
  const { currentPage, updateElement } = useEditorStore()
  const [showBrowser, setShowBrowser] = useState(false)

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
  if (!node) return <div className="text-xs text-gray-400 p-4">Select a media element</div>

  const inputClass = "w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors"
  const labelClass = "text-[11px] font-medium text-gray-500 block mb-0.5"
  const checkboxClass = "w-3.5 h-3.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"

  const setAttr = (key: string, value: string | boolean | number | undefined) => {
    if (key === 'src' || key === 'alt') {
      updateElement(elementId, { [key]: value } as Partial<ComponentNode>)
    } else {
      updateElement(elementId, { attributes: { ...node.attributes, [key]: value } })
    }
  }

  const handleBrowseSelect = (url: string) => {
    updateElement(elementId, { src: url } as Partial<ComponentNode>)
    setShowBrowser(false)
  }

  return (
    <div className="p-3 space-y-3">
      <label className={labelClass}>
        Source URL
        <input type="text" value={node.src || ''} onChange={(e) => setAttr('src', e.target.value)} className={inputClass} placeholder="https://..." />
      </label>

      <label className={labelClass}>
        Alt Text
        <input type="text" value={node.alt || ''} onChange={(e) => setAttr('alt', e.target.value)} className={inputClass} placeholder="Description" />
      </label>

      <button
        onClick={() => setShowBrowser(true)}
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
        type="button"
      >
        Browse Files
      </button>

      {showBrowser && (
        <FileBrowser
          selectMode
          onSelect={handleBrowseSelect}
          onClose={() => setShowBrowser(false)}
        />
      )}

      {(node.tag === 'video' || node.tag === 'audio') && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={node.attributes?.controls !== false}
            onChange={(e) => setAttr('controls', e.target.checked || undefined)}
            className={checkboxClass}
          />
          <span className={labelClass}>Show controls</span>
        </label>
      )}

      {node.tag === 'video' && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!node.attributes?.muted}
            onChange={(e) => setAttr('muted', e.target.checked || undefined)}
            className={checkboxClass}
          />
          <span className={labelClass}>Muted</span>
        </label>
      )}

      {node.tag === 'video' && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!node.attributes?.autoPlay}
            onChange={(e) => setAttr('autoPlay', e.target.checked || undefined)}
            className={checkboxClass}
          />
          <span className={labelClass}>Auto Play</span>
        </label>
      )}

      {node.tag === 'iframe' && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!node.attributes?.allowFullScreen}
            onChange={(e) => setAttr('allowFullScreen', e.target.checked || undefined)}
            className={checkboxClass}
          />
          <span className={labelClass}>Full Screen</span>
        </label>
      )}
    </div>
  )
}
