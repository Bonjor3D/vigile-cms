import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useEditorStore } from '../stores/editor.ts'
import { useSettingsStore } from '../stores/settings.ts'
import { Renderer, ResponsiveStyles } from '../renderer/Renderer.tsx'
import { EditHeader } from './EditHeader.tsx'
import { LeftPanel } from './LeftPanel.tsx'
import { DomTreePanel } from './DomTreePanel.tsx'
import { SelectionOverlay } from './SelectionOverlay.tsx'
import { HoverOverlay } from './HoverOverlay.tsx'
import { ContextMenu } from './ContextMenu.tsx'
import { ComponentRegistry } from '../renderer/ComponentRegistry.ts'
import type { ComponentNode } from '../types/component.ts'

function CanvasWorkspace({ onContextMenu }: { onContextMenu: (id: string, x: number, y: number) => void }) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const hasCenteredRef = useRef(false)
  const isPanningRef = useRef(false)
  const [isPanning, setIsPanning] = useState(false)

  const { isEditMode, currentPage, selectedElementId, hoveredElementId, selectElement, hoverElement, editMode, zoom, setZoom, viewportWidth, panX, panY, setPan, panBy } = useEditorStore()
  const { header, footer } = useSettingsStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, button, select, textarea, a, [contenteditable]')) return
      if (e.button !== 0) return
      const el = target.closest('[data-element-id]')
      if (el) {
        const rootId = useEditorStore.getState().currentPage?.root.id
        if (el.getAttribute('data-element-id') !== rootId) return
      }
      isPanningRef.current = true
      setIsPanning(true)
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: useEditorStore.getState().panX, panY: useEditorStore.getState().panY }
      e.preventDefault()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      useEditorStore.getState().setPan(
        panStartRef.current.panX + dx,
        panStartRef.current.panY + dy
      )
      e.preventDefault()
    }

    const onMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false
        setIsPanning(false)
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.style.touchAction = 'none'

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.style.touchAction = ''
    }
  }, [])

  useEffect(() => {
    const container = canvasRef.current
    if (!container) return
    const handler = (e: WheelEvent) => {
      if (!container.contains(e.target as Node)) return
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        setZoom(zoom + (e.deltaY > 0 ? -5 : 5))
      } else {
        panBy(-e.deltaX, -e.deltaY)
      }
    }
    document.addEventListener('wheel', handler, { passive: false })
    return () => document.removeEventListener('wheel', handler)
  }, [setZoom, zoom, panBy])

  useEffect(() => {
    const container = canvasRef.current
    if (!container || !currentPage || hasCenteredRef.current) return
    hasCenteredRef.current = true
    const rect = container.getBoundingClientRect()
    const frameWidth = viewportWidth * (zoom / 100)
    setPan(
      Math.max((rect.width - frameWidth) / 2, 24),
      80
    )
  }, [viewportWidth, zoom, currentPage, setPan])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isEditMode) return
    const target = (e.target as HTMLElement).closest('[data-element-id]')
    if (target) {
      const id = target.getAttribute('data-element-id')
      if (id) {
        selectElement(id)
        onContextMenu(id, e.clientX, e.clientY)
      }
    }
  }

  const handleMouseOver = (e: React.MouseEvent) => {
    if (!isEditMode) return
    const target = (e.target as HTMLElement).closest('[data-element-id]')
    if (target) {
      hoverElement(target.getAttribute('data-element-id'))
    } else {
      hoverElement(null)
    }
  }

  return (
    <>
      <LeftPanel />
      <div
        ref={canvasRef}
        id="editor-workspace"
        className="flex-1 relative overflow-hidden"
        style={{
          cursor: isPanning ? 'grabbing' : undefined,
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px`,
          backgroundColor: '#f1f5f9',
        }}
      >
        <ResponsiveStyles node={currentPage!.root} />
        <div
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
            transformOrigin: '0 0',
          }}
        >
          <div id="editor-frame" className="rounded-lg shadow-xl bg-white transition-all duration-200 border border-gray-200 select-none" style={{ width: viewportWidth }}>
            <div className="relative">
              {editMode !== 'page' && (
                <div className="absolute top-0 left-0 right-0 z-30 bg-indigo-500 text-white text-[10px] font-medium px-3 py-1 flex items-center gap-2">
                  <span className="uppercase tracking-wider">{editMode}</span>
                  <span className="opacity-70">— shared across all pages</span>
                </div>
              )}
            </div>
            <div onMouseOver={handleMouseOver} onContextMenu={handleContextMenu} style={{ paddingTop: editMode !== 'page' ? '24px' : '0' }}>
              <Renderer node={currentPage!.root} editMode />
            </div>
          </div>
        </div>

        {hoveredElementId && hoveredElementId !== selectedElementId && (
          <HoverOverlay elementId={hoveredElementId} />
        )}
        {selectedElementId && <SelectionOverlay elementId={selectedElementId} />}

        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur rounded-lg shadow-lg border border-gray-200 px-3 py-1.5 text-xs select-none" onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => setZoom(100)} className="text-gray-400 hover:text-gray-600 font-medium min-w-[28px] text-center">100%</button>
          <input
            type="range"
            min={10}
            max={200}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="w-24 h-1 accent-indigo-500 cursor-pointer"
          />
          <span className="text-gray-500 w-8 text-right tabular-nums">{zoom}%</span>
        </div>
      </div>

      <DomTreePanel onContextMenu={onContextMenu} />
    </>
  )
}

export function EditorLayout() {
  const { isEditMode, currentPage, editMode, selectedElementId, hoveredElementId, selectElement, hoverElement, draggedElement, setDraggedElement, moveElement, reparentElement, addElementAfter } = useEditorStore()
  const { header, footer } = useSettingsStore()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null)
  const openContextMenu = useCallback((id: string, x: number, y: number) => {
    setContextMenu({ x, y, elementId: id })
  }, [])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    if (!isEditMode) return
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-element-id]')
      if (target) selectElement(target.getAttribute('data-element-id'))
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [isEditMode, selectElement])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'add-panel') {
      const def = ComponentRegistry.get(data.elementType as string)
      if (def) {
        setDraggedElement({
          id: 'drag-preview',
          type: def.type,
          tag: def.tag,
          text: def.defaultText || def.label,
          children: [],
          styles: { ...ComponentRegistry.getDefaultStyles(def.tag) },
          classNames: [],
          locked: false,
          hidden: false,
        })
      }
    } else if (data?.type === 'page-element' && data?.source === 'tree' && data?.node) {
      setDraggedElement(data.node)
    }
  }, [setDraggedElement])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setDraggedElement(null)

    if (!over) return

    const activeData = active.data.current
    const overId = over.id as string

    if (activeData?.type === 'add-panel') {
      addElementAfter(
        overId,
        activeData.elementType as string,
        activeData.tag as string,
      )
    } else if (activeData?.type === 'page-element') {
      if (overId.startsWith('tree-after:')) {
        moveElement(active.id as string, overId.slice('tree-after:'.length))
      } else if (overId.startsWith('tree-child:')) {
        reparentElement(active.id as string, overId.slice('tree-child:'.length))
      } else {
        moveElement(active.id as string, overId)
      }
    }
  }, [setDraggedElement, addElementAfter, moveElement, reparentElement])

  const handleMouseOver = (e: React.MouseEvent) => {
    if (!isEditMode) return
    const target = (e.target as HTMLElement).closest('[data-element-id]')
    if (target) {
      hoverElement(target.getAttribute('data-element-id'))
    } else {
      hoverElement(null)
    }
  }

  if (!currentPage) return null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        <EditHeader />

        {isEditMode ? (
          <div className="flex flex-1 overflow-hidden">
            <CanvasWorkspace onContextMenu={openContextMenu} />
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-white">
            <div>
              {editMode !== 'page' ? (
                <><ResponsiveStyles node={currentPage.root} /><Renderer node={currentPage.root} /></>
              ) : (
                <>
                  {header && <><ResponsiveStyles node={header} /><Renderer node={header} /></>}
                  <ResponsiveStyles node={currentPage.root} />
                  <Renderer node={currentPage.root} />
                  {footer && <><ResponsiveStyles node={footer} /><Renderer node={footer} /></>}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={contextMenu.elementId}
          onClose={() => setContextMenu(null)}
        />
      )}

      <DragOverlay>
        {draggedElement && (
          <div className="px-3 py-2 bg-indigo-500 text-white text-sm rounded shadow-lg pointer-events-none">
            {draggedElement.text || draggedElement.type}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
