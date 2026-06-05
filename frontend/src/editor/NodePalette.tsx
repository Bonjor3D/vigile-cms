import { useCallback } from 'react'
import { CSS_NODE_DEFINITIONS } from './nodes/cssNodes.ts'
import { JS_NODE_DEFINITIONS } from './nodes/jsNodes.ts'
import { useNodeEditorStore } from './stores/nodeEditorStore.ts'
import type { NodeDefinition } from './nodes/nodeDefinitions.ts'

interface DragData {
  type: string
  category: 'css' | 'js'
  label: string
  inputs: NodeDefinition['inputs']
  outputs: NodeDefinition['outputs']
  defaultParams: Record<string, any>
}

export function NodePalette() {
  const { activeMode, showPalette, setShowPalette } = useNodeEditorStore()

  const definitions = activeMode === 'css' ? CSS_NODE_DEFINITIONS : JS_NODE_DEFINITIONS

  const categories = groupByCategory(definitions)

  const handleDragStart = useCallback((e: React.DragEvent, def: NodeDefinition) => {
    const data: DragData = { type: def.type, category: def.category, label: def.label, inputs: def.inputs, outputs: def.outputs, defaultParams: def.defaultParams }
    e.dataTransfer.setData('application/node-editor-node', JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  return (
    <div className={`border-r border-gray-200 bg-gray-50/50 flex flex-col transition-all duration-200 ${showPalette ? 'w-56' : 'w-0 overflow-hidden'}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 shrink-0">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Nodes</span>
        <button onClick={() => setShowPalette(!showPalette)} className="p-0.5 hover:bg-gray-200 rounded text-gray-400 text-xs" type="button" title="Toggle palette">
          ◀
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-3">
        {Object.entries(categories).map(([cat, items]) => (
          <div key={cat}>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1 mb-1">{cat}</div>
            <div className="space-y-0.5">
              {items.map((def) => (
                <div
                  key={def.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, def)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-grab active:cursor-grabbing hover:bg-white hover:shadow-sm hover:border-gray-200 border border-transparent transition-all text-gray-600"
                >
                  <span className="text-sm w-5 text-center shrink-0">{def.icon}</span>
                  <span className="truncate">{def.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function groupByCategory(defs: NodeDefinition[]): Record<string, NodeDefinition[]> {
  const groups: Record<string, NodeDefinition[]> = {}
  for (const def of defs) {
    const cat = def.label === 'Selector' ? 'Selectors'
      : def.label === 'Raw CSS' ? 'Utility'
      : def.label === 'Raw JS' ? 'Utility'
      : def.label === 'Comment' ? 'Utility'
      : def.category === 'css' ? 'Properties'
      : 'Flow'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(def)
  }
  return groups
}
