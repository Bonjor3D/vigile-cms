import type { CSSProperties, MouseEvent } from 'react'
import type { NodePort as NodePortType } from './nodes/nodeDefinitions.ts'

interface NodePortProps {
  port: NodePortType
  nodeId: string
  isInput: boolean
  color: string
  onMouseDown: (e: MouseEvent) => void
}

export function NodePort({ port, nodeId, isInput, color, onMouseDown }: NodePortProps) {
  return (
    <div
      data-port-id={port.id}
      data-node-id={nodeId}
      data-port-dir={isInput ? 'input' : 'output'}
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e) }}
      title={`${port.label || port.id} (${port.type})`}
      style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: color,
        border: '2px solid white',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.12)',
        cursor: isInput ? 'pointer' : 'crosshair',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
        transition: 'transform 0.1s',
      } as CSSProperties}
      className="node-port"
    />
  )
}
