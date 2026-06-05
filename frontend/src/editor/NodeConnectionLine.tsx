import type { CSSProperties, MouseEvent } from 'react'
import { useNodeEditorStore } from './stores/nodeEditorStore.ts'

interface NodeConnectionLineProps {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export function NodeConnectionLine({ id, from, to }: NodeConnectionLineProps) {
  const { removeConnection } = useNodeEditorStore()

  const dx = to.x - from.x
  const cp = Math.max(50, Math.abs(dx) * 0.5)
  const path = `M ${from.x} ${from.y} C ${from.x + cp} ${from.y}, ${to.x - cp} ${to.y}, ${to.x} ${to.y}`

  return (
    <g className="node-connection">
      {/* Invisible wider path for easier clicking */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={12}
        style={{ cursor: 'pointer' } as CSSProperties}
        onClick={(e: MouseEvent) => { e.stopPropagation(); removeConnection(id) }}
      />
      <path d={path} fill="none" stroke="#9ca3af" strokeWidth={2}
        style={{ pointerEvents: 'none' } as CSSProperties}
      />
    </g>
  )
}
