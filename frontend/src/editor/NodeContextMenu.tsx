import { useEffect, useRef } from 'react'
import { useNodeEditorStore } from './stores/nodeEditorStore.ts'

export function NodeContextMenu() {
  const { contextMenu, setContextMenu, removeNodes, duplicateNode } = useNodeEditorStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [contextMenu, setContextMenu])

  useEffect(() => {
    if (!contextMenu) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [contextMenu, setContextMenu])

  if (!contextMenu) return null

  const { x, y, nodeId } = contextMenu

  const handleDelete = () => {
    removeNodes([nodeId])
    setContextMenu(null)
  }

  const handleDuplicate = () => {
    duplicateNode(nodeId)
    setContextMenu(null)
  }

  const handleSelectConnected = () => {
    const store = useNodeEditorStore.getState()
    const connected = new Set<string>()
    connected.add(nodeId)
    for (const conn of store.connections) {
      if (conn.fromNode === nodeId) connected.add(conn.toNode)
      if (conn.toNode === nodeId) connected.add(conn.fromNode)
    }
    store.selectNode(nodeId, false)
    for (const id of connected) {
      if (id !== nodeId) store.selectNode(id, true)
    }
    setContextMenu(null)
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', left: x, top: y, zIndex: 1000,
        background: 'white', borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb',
        padding: '4px 0', minWidth: '140px',
      }}
    >
      <MenuItem label="Delete" shortcut="Del" onClick={handleDelete} />
      <MenuItem label="Duplicate" shortcut="Ctrl+D" onClick={handleDuplicate} />
      <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 8px' } as React.CSSProperties} />
      <MenuItem label="Select Connected" onClick={handleSelectConnected} />
    </div>
  )
}

function MenuItem({ label, shortcut, onClick }: { label: string; shortcut?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', fontSize: '12px', color: '#374151', cursor: 'pointer',
        border: 'none', background: 'transparent', boxSizing: 'border-box',
      } as React.CSSProperties}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      type="button"
    >
      <span>{label}</span>
      {shortcut && <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '16px' }}>{shortcut}</span>}
    </button>
  )
}
