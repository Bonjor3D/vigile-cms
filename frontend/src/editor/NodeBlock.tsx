import { useState, type CSSProperties, type MouseEvent } from 'react'
import type { VisualNode, NodePort as NodePortType } from './nodes/nodeDefinitions.ts'
import { PORT_TYPE_COLORS, PORT_TYPE_LABELS } from './nodes/nodeDefinitions.ts'
import { CSS_NODE_DEFINITIONS } from './nodes/cssNodes.ts'
import { JS_NODE_DEFINITIONS } from './nodes/jsNodes.ts'
import { NodePort } from './NodePort.tsx'
import { ParamInput } from './ParamInput.tsx'
import { useNodeEditorStore } from './stores/nodeEditorStore.ts'

interface NodeBlockProps {
  node: VisualNode
  isSelected: boolean
  isHovered: boolean
  onMouseDown: (e: MouseEvent) => void
  onClick: (e: MouseEvent) => void
  onHover: (hovering: boolean) => void
  onPortMouseDown: (portId: string, isInput: boolean) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  css: '#4f46e5',
  js: '#0891b2',
}

function getDef(node: VisualNode) {
  const all = [...CSS_NODE_DEFINITIONS, ...JS_NODE_DEFINITIONS]
  return all.find((d) => d.type === node.type)
}

export function NodeBlock({ node, isSelected, isHovered, onMouseDown, onClick, onHover, onPortMouseDown }: NodeBlockProps) {
  const { connections, updateNode, setContextMenu } = useNodeEditorStore()
  const catColor = CATEGORY_COLORS[node.category] || '#6b7280'
  const def = getDef(node)

  const connectedInputs = new Set(
    connections.filter((c) => c.toNode === node.id).map((c) => c.toPort)
  )

  const handleParamChange = (name: string, value: any) => {
    updateNode(node.id, { params: { ...node.params, [name]: value } })
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id })
  }

  const isReroute = node.type === 'reroute'

  if (isReroute) {
    const hasConn = connections.some((c) => c.toNode === node.id || c.fromNode === node.id)
    return (
      <div className="node-block"
        onMouseDown={onMouseDown}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: hasConn ? '#818cf8' : '#d1d5db',
          border: '2px solid white',
          boxShadow: isSelected ? '0 0 0 2px #4f46e5, 0 2px 8px rgba(0,0,0,0.2)' : '0 0 0 1px rgba(0,0,0,0.12)',
          cursor: 'grab', position: 'relative', zIndex: 5,
        } as CSSProperties}
      >
        {node.inputs.map((port) => (
          <NodePort key={port.id} port={port} nodeId={node.id} isInput={true}
            color={PORT_TYPE_COLORS[port.type] || '#9ca3af'} onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(port.id, true) }} />
        ))}
        {node.outputs.map((port) => (
          <NodePort key={port.id} port={port} nodeId={node.id} isInput={false}
            color={PORT_TYPE_COLORS[port.type] || '#9ca3af'} onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(port.id, false) }} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="node-block"
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        width: '180px',
        background: 'white',
        borderRadius: '10px',
        boxShadow: isSelected
          ? `0 0 0 2px ${catColor}, 0 4px 12px rgba(0,0,0,0.15)`
          : '0 2px 8px rgba(0,0,0,0.08)',
        border: `1px solid ${isSelected ? catColor : '#e5e7eb'}`,
        cursor: 'grab',
        userSelect: 'none',
        position: 'relative',
        transition: 'box-shadow 0.1s',
      } as CSSProperties}
    >
      <div style={{
        background: catColor,
        padding: '4px 10px',
        borderRadius: '9px 9px 0 0',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: '28px',
        boxSizing: 'border-box',
      } as CSSProperties}>
        <span style={{ fontSize: '12px', lineHeight: '1' }}>{node.category === 'css' ? '🎨' : '⚡'}</span>
        <span style={{ color: 'white', fontSize: '11px', fontWeight: 500, lineHeight: '1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.label}
        </span>
      </div>

      <div style={{ padding: '2px 0', position: 'relative', minHeight: '20px' } as CSSProperties}>
        {node.inputs.map((port) => (
          <div key={port.id} style={{ display: 'flex', alignItems: 'center', height: '20px', paddingLeft: '4px' } as CSSProperties}>
            <NodePort
              port={port}
              nodeId={node.id}
              isInput={true}
              color={PORT_TYPE_COLORS[port.type] || '#9ca3af'}
              onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(port.id, true) }}
            />
            {port.label && (
              <span style={{ fontSize: '10px', color: '#6b7280', marginLeft: '4px', lineHeight: '1' } as CSSProperties}>
                {port.label}
              </span>
            )}
            <span style={{
              fontSize: '8px', color: PORT_TYPE_COLORS[port.type] || '#9ca3af',
              marginLeft: '2px', fontWeight: 500, opacity: 0.6, lineHeight: '1',
            } as CSSProperties}>
              {PORT_TYPE_LABELS[port.type] || ''}
            </span>
          </div>
        ))}

        {node.outputs.map((port) => (
          <div key={port.id} style={{ display: 'flex', alignItems: 'center', height: '20px', justifyContent: 'flex-end', paddingRight: '4px' } as CSSProperties}>
            <span style={{
              fontSize: '8px', color: PORT_TYPE_COLORS[port.type] || '#9ca3af',
              marginRight: '2px', fontWeight: 500, opacity: 0.6, lineHeight: '1',
            } as CSSProperties}>
              {PORT_TYPE_LABELS[port.type] || ''}
            </span>
            {port.label && <span style={{ fontSize: '10px', color: '#6b7280', marginRight: '4px', lineHeight: '1' } as CSSProperties}>{port.label}</span>}
            <NodePort
              port={port}
              nodeId={node.id}
              isInput={false}
              color={PORT_TYPE_COLORS[port.type] || '#9ca3af'}
              onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(port.id, false) }}
            />
          </div>
        ))}
      </div>

      {Object.keys(node.params).length > 0 && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '4px 8px' } as CSSProperties}>
          {Object.entries(node.params).map(([key, val]) => {
            const meta = def?.paramMeta?.[key]
            return (
              <ParamInput
                key={key}
                name={key}
                value={val}
                meta={meta}
                onChange={handleParamChange}
                hasConnection={connectedInputs.has(key)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
