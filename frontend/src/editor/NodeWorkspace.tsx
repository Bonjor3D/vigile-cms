import { useRef, useCallback, useEffect, useState, type DragEvent, type MouseEvent } from 'react'
import { useNodeEditorStore } from './stores/nodeEditorStore.ts'
import { NodeBlock } from './NodeBlock.tsx'
import { NodeConnectionLine } from './NodeConnectionLine.tsx'
import { NodeContextMenu } from './NodeContextMenu.tsx'

const NODE_WIDTH = 180
const HEADER_HEIGHT = 28
const PORT_ROW_HEIGHT = 20

export function getPortPos(node: { x: number; y: number; inputs: any[]; outputs: any[] }, portId: string, isInput: boolean) {
  const nInputs = node.inputs.length
  if (isInput) {
    const idx = node.inputs.findIndex((p) => p.id === portId)
    if (idx === -1) return { x: node.x, y: node.y }
    return { x: node.x, y: node.y + HEADER_HEIGHT + idx * PORT_ROW_HEIGHT + PORT_ROW_HEIGHT / 2 }
  } else {
    const idx = node.outputs.findIndex((p) => p.id === portId)
    if (idx === -1) return { x: node.x, y: node.y }
    return { x: node.x + NODE_WIDTH, y: node.y + HEADER_HEIGHT + (nInputs + idx) * PORT_ROW_HEIGHT + PORT_ROW_HEIGHT / 2 }
  }
}

function lineIntersect(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number
): { x: number; y: number; t: number } | null {
  const d1x = bx - ax, d1y = by - ay
  const d2x = dx - cx, d2y = dy - cy
  const denom = d1x * d2y - d1y * d2x
  if (Math.abs(denom) < 0.0001) return null
  const t = ((cx - ax) * d2y - (cy - ay) * d2x) / denom
  const u = ((cx - ax) * d1y - (cy - ay) * d1x) / denom
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { x: ax + t * d1x, y: ay + t * d1y, t }
}

export function NodeWorkspace() {
  const {
    nodes, connections, activeMode, selectedNodeIds, connecting, hoveredNodeId, cutting, contextMenu,
    viewBox, addNode, moveNode, selectNode, clearSelection, setHoveredNode,
    setViewBox, setConnecting, setCutting, addConnection, removeNodes, splitConnection,
  } = useNodeEditorStore()

  const wsRef = useRef<HTMLDivElement>(null)
  const [panning, setPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectingMouse, setConnectingMouse] = useState<{ x: number; y: number } | null>(null)

  const snapToGrid = (v: number) => Math.round(v / 20) * 20

  const screenToWorkspace = useCallback((sx: number, sy: number) => {
    const rect = wsRef.current?.getBoundingClientRect()
    if (!rect) return { x: sx, y: sy }
    return {
      x: (sx - rect.left - viewBox.x) / viewBox.zoom,
      y: (sy - rect.top - viewBox.y) / viewBox.zoom,
    }
  }, [viewBox])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 2) {
      const target = e.target as HTMLElement
      if (target.closest('.node-block') || target.closest('.node-port')) return
      const wp = screenToWorkspace(e.clientX, e.clientY)
      setCutting({ from: { x: wp.x, y: wp.y }, to: { x: wp.x, y: wp.y } })
      return
    }
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('.node-block') || target.closest('.node-port') || target.closest('.node-connection')) return
    clearSelection()
    setPanning(true)
    setPanStart({ x: e.clientX - viewBox.x, y: e.clientY - viewBox.y })
  }, [viewBox, clearSelection, screenToWorkspace, setCutting])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (panning) {
      setViewBox({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    }
    if (connecting) {
      const wp = screenToWorkspace(e.clientX, e.clientY)
      setConnectingMouse(wp)
    }
    if (cutting) {
      const wp = screenToWorkspace(e.clientX, e.clientY)
      setCutting({ from: cutting.from, to: wp })
    }
    if (draggingNode) {
      const wp = screenToWorkspace(e.clientX, e.clientY)
      moveNode(draggingNode, snapToGrid(wp.x - dragOffset.x), snapToGrid(wp.y - dragOffset.y))
    }
  }, [panning, panStart, connecting, cutting, draggingNode, dragOffset, screenToWorkspace, setViewBox, moveNode, setCutting])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button === 2 && cutting) {
      const cutStart = cutting.from
      const cutEnd = cutting.to
      setCutting(null)
      const active = nodes.filter((n) => n.category === activeMode)
      const nodeMap = Object.fromEntries(active.map((n) => [n.id, n]))
      for (const conn of connections) {
        const from = nodeMap[conn.fromNode]
        const to = nodeMap[conn.toNode]
        if (!from || !to) continue
        const fromPos = getPortPos(from, conn.fromPort, false)
        const toPos = getPortPos(to, conn.toPort, true)
        const hit = lineIntersect(cutStart.x, cutStart.y, cutEnd.x, cutEnd.y, fromPos.x, fromPos.y, toPos.x, toPos.y)
        if (hit) {
          splitConnection(conn.id, hit.x, hit.y)
        }
      }
      return
    }
    setPanning(false)
    if (connecting) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const portEl = el?.closest('[data-port-id]') as HTMLElement | null
      if (portEl) {
        const toNode = portEl.getAttribute('data-node-id')
        const toPort = portEl.getAttribute('data-port-id')
        const dir = portEl.getAttribute('data-port-dir')
        if (toNode && toPort && dir === 'input') {
          addConnection(connecting.fromNode, connecting.fromPort, toNode, toPort)
        }
      }
      setConnecting(null)
      setConnectingMouse(null)
    }
    setDraggingNode(null)
  }, [connecting, cutting, connections, nodes, activeMode, addConnection, setConnecting, setCutting, splitConnection])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newZoom = Math.max(0.3, Math.min(3, viewBox.zoom + delta))
      const rect = wsRef.current?.getBoundingClientRect()
      if (rect) {
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        setViewBox({
          x: mx - (mx - viewBox.x) * (newZoom / viewBox.zoom),
          y: my - (my - viewBox.y) * (newZoom / viewBox.zoom),
          zoom: newZoom,
        })
      }
    } else {
      setViewBox({ x: viewBox.x - e.deltaX, y: viewBox.y - e.deltaY })
    }
  }, [viewBox, setViewBox])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/node-editor-node')
    if (!raw) return
    const def = JSON.parse(raw)
    const wp = screenToWorkspace(e.clientX, e.clientY)
    const x = snapToGrid(wp.x - NODE_WIDTH / 2)
    const y = snapToGrid(wp.y - 40)
    addNode(def.type, def.category, def.label, x, y, def.inputs || [], def.outputs || [], def.defaultParams || {})
  }, [screenToWorkspace, addNode])

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }, [])

  const handleNodeDragStart = useCallback((nodeId: string, e: MouseEvent) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    const wp = screenToWorkspace(e.clientX, e.clientY)
    setDraggingNode(nodeId)
    setDragOffset({ x: wp.x - node.x, y: wp.y - node.y })
    if (!e.shiftKey) clearSelection()
    selectNode(nodeId, e.shiftKey)
  }, [nodes, screenToWorkspace, clearSelection, selectNode])

  const handleNodeClick = useCallback((nodeId: string, e: MouseEvent) => {
    selectNode(nodeId, e.shiftKey)
  }, [selectNode])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0) {
      removeNodes(selectedNodeIds)
    }
    if (e.key === 'Escape') {
      if (connecting) { setConnecting(null); setConnectingMouse(null) }
      if (contextMenu) useNodeEditorStore.getState().setContextMenu(null)
    }
  }, [selectedNodeIds, connecting, contextMenu, removeNodes, setConnecting])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const activeNodes = nodes.filter((n) => n.category === activeMode)
  const nodeMap = Object.fromEntries(activeNodes.map((n) => [n.id, n]))

  const tempLine = connecting && connectingMouse ? (() => {
    const fromNode = nodeMap[connecting.fromNode]
    if (!fromNode) return null
    const fromPos = getPortPos(fromNode, connecting.fromPort, false)
    return { from: fromPos, to: connectingMouse }
  })() : null

  return (
    <div className="flex-1 relative overflow-hidden bg-[#f8f9fb]" ref={wsRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={handleWheel}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ cursor: panning ? 'grabbing' : connecting ? 'crosshair' : cutting ? 'crosshair' : 'default' }}
    >
      <div style={{
        transform: `translate(${viewBox.x}px, ${viewBox.y}px) scale(${viewBox.zoom})`,
        transformOrigin: '0 0',
        position: 'absolute',
        top: 0, left: 0,
        width: 0, height: 0,
      }}>
        <svg width="10000" height="10000" x="-5000" y="-5000" style={{ position: 'absolute', pointerEvents: 'none' }}>
          <defs>
            <pattern id="node-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.8" fill="#dce0e5" />
            </pattern>
          </defs>
          <rect width="10000" height="10000" x="-5000" y="-5000" fill="url(#node-grid)" />
        </svg>

        <svg width="10000" height="10000" x="-5000" y="-5000" style={{ position: 'absolute', pointerEvents: 'none' }}>
          {activeNodes.flatMap((node) =>
            connections
              .filter((c) => c.fromNode === node.id || c.toNode === node.id)
              .map((conn) => {
                const from = nodeMap[conn.fromNode]
                const to = nodeMap[conn.toNode]
                if (!from || !to) return null
                const fromPos = getPortPos(from, conn.fromPort, false)
                const toPos = getPortPos(to, conn.toPort, true)
                return (
                  <g key={conn.id} className="node-connection">
                    <NodeConnectionLine id={conn.id} from={fromPos} to={toPos} />
                  </g>
                )
              })
          )}
          {tempLine && (
            <line x1={tempLine.from.x} y1={tempLine.from.y} x2={tempLine.to.x} y2={tempLine.to.y}
              stroke="#818cf8" strokeWidth={2} strokeDasharray="5,3" className="pointer-events-none" />
          )}
          {cutting && (
            <line x1={cutting.from.x} y1={cutting.from.y} x2={cutting.to.x} y2={cutting.to.y}
              stroke="#ef4444" strokeWidth={2} strokeDasharray="8,4" className="pointer-events-none" />
          )}
        </svg>

        {activeNodes.map((node) => (
          <div key={node.id} style={{ position: 'absolute', left: node.x, top: node.y }}>
            <NodeBlock
              node={node}
              isSelected={selectedNodeIds.includes(node.id)}
              isHovered={hoveredNodeId === node.id}
              onMouseDown={(e) => handleNodeDragStart(node.id, e)}
              onClick={(e) => handleNodeClick(node.id, e)}
              onHover={(h) => setHoveredNode(h ? node.id : null)}
              onPortMouseDown={(portId, isInput) => {
                if (!isInput) {
                  setConnecting({ fromNode: node.id, fromPort: portId })
                }
              }}
            />
          </div>
        ))}
      </div>

      {activeNodes.length === 0 && !cutting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-300">
            <div className="text-3xl mb-2">⊞</div>
            <div className="text-sm">Drag nodes from the palette to start building</div>
          </div>
        </div>
      )}

      <NodeContextMenu />
    </div>
  )
}
