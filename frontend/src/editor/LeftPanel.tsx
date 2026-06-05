import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '../stores/editor.ts'
import { useTemplateStore } from '../stores/template.ts'
import { createElement } from '../utils/element-factory.ts'
import { ComponentRegistry } from '../renderer/ComponentRegistry.ts'
import { StylePanel } from './StylePanel.tsx'
import { MediaSettings } from './MediaSettings.tsx'
import { InteractiveSettings } from './InteractiveSettings.tsx'
import { CodeEditor } from './CodeEditor.tsx'
import { TextContentPanel } from './TextContentPanel.tsx'
import { ThemeTab } from './ThemeTab.tsx'
import { useDraggable } from '@dnd-kit/core'
import { v4 as uuid } from 'uuid'
import type { ComponentNode } from '../types/component.ts'

const MEDIA_TAGS = ['img', 'video', 'audio', 'iframe']
const INTERACTIVE_TAGS = ['button', 'a', 'input', 'textarea']
const TEXT_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'small', 'blockquote', 'code', 'pre', 'li', 'label']

function findNode(id: string, node?: ComponentNode | null): ComponentNode | null {
  if (!node) return null
  if (node.id === id) return node
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(id, child)
      if (found) return found
    }
  }
  return null
}

export function LeftPanel() {
  const { currentPage, setCurrentPage, selectedElementId } = useEditorStore()

  const [width, setWidth] = useState(280)
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizeRef.current = { startX: e.clientX, startWidth: width }

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return
      const delta = e.clientX - resizeRef.current.startX
      const newWidth = Math.max(180, Math.min(500, resizeRef.current.startWidth + delta))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      resizeRef.current = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  const selectedNode = useMemo(
    () => selectedElementId ? findNode(selectedElementId, currentPage?.root) : null,
    [selectedElementId, currentPage]
  )

  useEffect(() => { useTemplateStore.getState().load() }, [])

  const { templates, remove } = useTemplateStore()

  const tabs = useMemo(() => {
    const base = ['Add'] as string[]
    if (selectedNode) base.push('Style')
    if (selectedNode && TEXT_TAGS.includes(selectedNode.tag)) base.push('Content')
    if (selectedNode && MEDIA_TAGS.includes(selectedNode.tag)) base.push('Media')
    if (selectedNode && INTERACTIVE_TAGS.includes(selectedNode.tag)) base.push('Interactive')
    base.push('Templates')
    base.push('Code')
    base.push('Theme')
    return base
  }, [selectedNode])

  const [activeTab, setActiveTab] = useState('Add')

  const safeActiveTab = tabs.includes(activeTab) ? activeTab : tabs[0] || 'Add'
  if (safeActiveTab !== activeTab) setActiveTab(safeActiveTab)

  const categories = ['text', 'container', 'media', 'interactive', 'lists', 'layout'] as const

  const handleAddElement = (type: string) => {
    if (!currentPage) return
    const def = ComponentRegistry.get(type)
    if (!def) return

    const { selectedElementId, addChild } = useEditorStore.getState()

    if (selectedElementId) {
      addChild(selectedElementId, def.type, def.tag)
    } else {
      const el = createElement(def.type, def.tag, {
        text: ComponentRegistry.getDefaultText(def.tag),
        styles: { ...ComponentRegistry.getDefaultStyles(def.tag) },
      })
      const newRoot = {
        ...currentPage.root,
        children: [...(currentPage.root.children || []), el],
      }
      setCurrentPage({ ...currentPage, root: newRoot })
    }
  }

  const handleInsertTemplate = (node: ComponentNode) => {
    if (!currentPage) return
    const pasted = JSON.parse(JSON.stringify(node))
    const reId = (n: ComponentNode): ComponentNode => ({
      ...n,
      id: uuid(),
      children: n.children?.map(reId),
    })
    const cloned = reId(pasted)
    const { selectedElementId, insertNode } = useEditorStore.getState()
    const targetId = selectedElementId || currentPage.root.id
    insertNode(targetId, cloned)
  }

  return (
    <div className="bg-white border-r border-gray-200 flex flex-col shrink-0 relative" style={{ width }}>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-[11px] font-medium px-2 py-2 border-b-2 transition-colors ${
              safeActiveTab === tab
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'Interactive' ? 'Interact' : tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {safeActiveTab === 'Add' && (
          <div className="p-3 space-y-4">
            {categories.map((cat) => {
              const elements = ComponentRegistry.getAll().filter((e) => e.category === cat)
              if (elements.length === 0) return null

              return (
                <div key={cat}>
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {elements.map((el) => (
                      <DraggableElementButton
                        key={el.type}
                        element={el}
                        onClick={() => handleAddElement(el.type)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {safeActiveTab === 'Style' && selectedNode && <StylePanel elementId={selectedNode.id} />}
        {safeActiveTab === 'Style' && !selectedNode && <p className="text-xs text-gray-400 text-center mt-8">Select an element</p>}

        {safeActiveTab === 'Content' && selectedNode && <TextContentPanel elementId={selectedNode.id} />}
        {safeActiveTab === 'Content' && !selectedNode && <p className="text-xs text-gray-400 text-center mt-8">Select a text element</p>}

        {safeActiveTab === 'Media' && selectedNode && <MediaSettings elementId={selectedNode.id} />}
        {safeActiveTab === 'Media' && !selectedNode && <p className="text-xs text-gray-400 text-center mt-8">Select a media element</p>}

        {safeActiveTab === 'Interactive' && selectedNode && <InteractiveSettings elementId={selectedNode.id} />}
        {safeActiveTab === 'Interactive' && !selectedNode && <p className="text-xs text-gray-400 text-center mt-8">Select an interactive element</p>}

        {safeActiveTab === 'Templates' && (
          <div className="p-3 space-y-2">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Saved Templates</h3>
            {templates.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-6">No saved templates.<br />Right-click a div and choose "Save as Template".</p>
            )}
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:border-indigo-300 bg-white group">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate">{t.name}</div>
                  <div className="text-[10px] text-gray-400">{t.node.tag} — {countNodes(t.node)} elements</div>
                </div>
                <button
                  onClick={() => handleInsertTemplate(t.node)}
                  className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Insert"
                  type="button"
                >
                  +
                </button>
                <button
                  onClick={() => remove(t.id)}
                  className="text-[10px] px-1.5 py-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Delete"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {safeActiveTab === 'Code' && selectedNode && <CodeEditor elementId={selectedNode.id} />}
        {safeActiveTab === 'Code' && !selectedNode && <p className="text-xs text-gray-400 text-center mt-8">Select an element</p>}

        {safeActiveTab === 'Theme' && <ThemeTab />}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-300/50 transition-colors group z-10"
      >
        <div className="absolute inset-y-0 right-0 w-0.5 group-hover:bg-indigo-400 transition-colors" />
      </div>
    </div>
  )
}

function countNodes(node: ComponentNode): number {
  let count = 1
  if (node.children) for (const c of node.children) count += countNodes(c)
  return count
}

function DraggableElementButton({
  element,
  onClick,
}: {
  element: { type: string; tag: string; label: string; defaultText?: string }
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `__add__${element.type}`,
    data: {
      type: 'add-panel',
      elementType: element.type,
      tag: element.tag,
      defaultText: element.defaultText,
    },
  })

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1.5 border border-gray-200 rounded hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 transition-colors text-left ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {element.label}
    </button>
  )
}
