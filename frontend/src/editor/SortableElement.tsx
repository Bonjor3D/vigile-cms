import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface SortableElementProps {
  id: string
  children: ReactNode
  isDragging?: boolean
}

export function SortableElement({ id, children, isDragging }: SortableElementProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isDraggingSelf } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isDraggingSelf ? 0.4 : 1,
    position: 'relative',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}
