import { useDroppable, useDraggable } from '@dnd-kit/core'
import type { ComponentNode } from '../types/component.ts'
import { useEditorStore } from '../stores/editor.ts'

export function DomTreePanel({ onContextMenu }: { onContextMenu: (id: string, x: number, y: number) => void }) {
  const { currentPage, selectedElementId, selectElement, deleteElement, duplicateElement, editMode } = useEditorStore()

  const rootNode: ComponentNode | null = currentPage?.root || null

  if (!rootNode) return null

  return (
    <div className="w-[280px] bg-white border-l border-gray-200 flex flex-col shrink-0">
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">DOM Tree</h3>
        {editMode !== 'page' && (
          <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">{editMode}</span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-2">
        <TreeNode node={rootNode} depth={0} selectedId={selectedElementId} onSelect={selectElement} onDelete={deleteElement} onDuplicate={duplicateElement} onContextMenu={onContextMenu} />
      </div>
    </div>
  )
}

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onDelete,
  onDuplicate,
  onContextMenu,
}: {
  node: ComponentNode
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onContextMenu: (id: string, x: number, y: number) => void
}) {
  const isSelected = node.id === selectedId
  const hasChildren = node.children && node.children.length > 0

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: node.id,
    data: { type: 'page-element', source: 'tree', node },
  })

  const { setNodeRef: setChildRef, isOver: isChildOver } = useDroppable({
    id: `tree-child:${node.id}`,
    data: { action: 'child', targetId: node.id },
  })

  return (
    <div className={isDragging ? 'opacity-40' : ''}>
      <div
        ref={(el) => {
          setDragRef(el)
          setChildRef(el)
        }}
        {...listeners}
        {...attributes}
        onClick={() => onSelect(node.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          onSelect(node.id)
          onContextMenu(node.id, e.clientX, e.clientY)
        }}
        className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-grab active:cursor-grabbing group transition-colors ${
          isChildOver ? 'bg-indigo-100 ring-1 ring-indigo-400' : isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <span className="text-gray-400 font-mono text-[10px] shrink-0">{'<'}{node.tag}{'>'}</span>
        {node.text && <span className="text-gray-500 truncate max-w-[100px]">{node.text}</span>}
        {node.locked && <span className="text-[10px] text-gray-300">&#x1F512;</span>}
        {node.hidden && <span className="text-[10px] text-gray-300">&#x1F441;</span>}

        {isChildOver && (
          <span className="ml-auto text-[10px] text-indigo-500 font-medium">+ child</span>
        )}

        <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(node.id) }}
            className="text-[10px] w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400"
            title="Duplicate"
          >
            D
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node.id) }}
            className="text-[10px] w-4 h-4 flex items-center justify-center rounded hover:bg-red-50 text-red-400"
            title="Delete"
          >
            X
          </button>
        </div>
      </div>

      <DropLines nodeId={node.id} depth={depth} childrenList={node.children} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} onContextMenu={onContextMenu} />
    </div>
  )
}

function DropLines({
  nodeId,
  depth,
  childrenList,
  selectedId,
  onSelect,
  onDelete,
  onDuplicate,
  onContextMenu,
}: {
  nodeId: string
  depth: number
  childrenList?: ComponentNode[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onContextMenu: (id: string, x: number, y: number) => void
}) {
  const children = childrenList ?? []

  return (
    <div>
      {children.map((child) => (
        <div key={child.id}>
          <AfterDropLine nodeId={child.id} depth={depth + 1} />
          <TreeNode
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onContextMenu={onContextMenu}
          />
        </div>
      ))}
    </div>
  )
}

function AfterDropLine({ nodeId, depth }: { nodeId: string; depth: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tree-after:${nodeId}`,
    data: { action: 'after', targetId: nodeId },
  })

  return (
    <div
      ref={setNodeRef}
      className={`h-[4px] relative z-10 transition-colors ${isOver ? 'bg-indigo-400' : ''}`}
      style={{ marginLeft: `${8 + depth * 16}px` }}
    />
  )
}
