import { useEditorStore } from '../stores/editor.ts'
import type { ComponentNode } from '../types/component.ts'
import { CodeEditorPanel } from './CodeEditorPanel.tsx'

interface CodeEditorProps {
  elementId: string
}

export function CodeEditor({ elementId }: CodeEditorProps) {
  const { currentPage, updateElement } = useEditorStore()

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
  if (!node) return <div className="text-xs text-gray-400 p-4">Select an element</div>

  const attrs = node.attributes || {}

  const inputClass = "w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors"
  const labelClass = "text-[11px] font-medium text-gray-500 block mb-0.5"

  return (
    <div className="p-3 space-y-3">
      <label className={labelClass}>
        Element ID
        <input type="text" value={node.id || ''} readOnly className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
      </label>

      <label className={labelClass}>
        HTML ID
        <input type="text" value={String(attrs.id ?? '')} onChange={(e) => updateElement(elementId, { attributes: { ...attrs, id: e.target.value } })} className={inputClass} placeholder="custom-id" />
      </label>

      <label className={labelClass}>
        CSS Class
        <input type="text" value={node.classNames?.join(' ') || ''} onChange={(e) => updateElement(elementId, { classNames: e.target.value ? e.target.value.split(' ') : [] })} className={inputClass} placeholder="class1 class2" />
      </label>

      <label className={labelClass}>
        Custom CSS
        <CodeEditorPanel
          value={node.styles?.customCss || ''}
          onChange={(val) => updateElement(elementId, { styles: { ...node.styles, customCss: val } })}
          language="css"
          height="120px"
        />
      </label>

      <label className={labelClass}>
        Custom JS
        <CodeEditorPanel
          value={node.customJs || ''}
          onChange={(val) => updateElement(elementId, { customJs: val })}
          language="javascript"
          height="120px"
        />
      </label>
    </div>
  )
}
