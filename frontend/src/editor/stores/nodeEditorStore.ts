import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { VisualNode, NodeConnection } from '../nodes/nodeDefinitions.ts'

export interface NodeEditorFile {
  id: string
  name: string
  category: 'css' | 'js'
  nodes: VisualNode[]
  connections: NodeConnection[]
}

const FILE_STORAGE_KEY = 'vigile_node_files'

function loadFilesFromStorage(): NodeEditorFile[] {
  try {
    const raw = localStorage.getItem(FILE_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function persistFiles(files: NodeEditorFile[]) {
  try { localStorage.setItem(FILE_STORAGE_KEY, JSON.stringify(files)) } catch { /* ignore */ }
}

function createDefaultFiles(): NodeEditorFile[] {
  return [
    { id: uuid(), name: 'Styles', category: 'css', nodes: [], connections: [] },
    { id: uuid(), name: 'Scripts', category: 'js', nodes: [], connections: [] },
  ]
}

interface NodeEditorState {
  files: NodeEditorFile[]
  activeFileId: string | null
  activeMode: 'css' | 'js'
  selectedNodeIds: string[]
  hoveredNodeId: string | null
  connecting: { fromNode: string; fromPort: string } | null
  cutting: { from: { x: number; y: number }; to: { x: number; y: number } } | null
  viewBox: { x: number; y: number; zoom: number }
  showCodePanel: boolean
  showPalette: boolean
  contextMenu: { x: number; y: number; nodeId: string } | null

  nodes: VisualNode[]
  connections: NodeConnection[]

  addFile: (name: string, category: 'css' | 'js') => string
  removeFile: (id: string) => void
  renameFile: (id: string, name: string) => void
  setActiveFile: (id: string) => void
  getActiveFile: () => NodeEditorFile | undefined

  addNode: (type: string, category: 'css' | 'js', label: string, x: number, y: number, inputs: VisualNode['inputs'], outputs: VisualNode['outputs'], params: Record<string, any>) => string
  updateNode: (id: string, patch: Partial<VisualNode>) => void
  moveNode: (id: string, x: number, y: number) => void
  removeNodes: (ids: string[]) => void
  duplicateNode: (id: string) => void
  addConnection: (fromNode: string, fromPort: string, toNode: string, toPort: string) => void
  removeConnection: (id: string) => void
  splitConnection: (connId: string, midX: number, midY: number) => void
  setConnecting: (conn: { fromNode: string; fromPort: string } | null) => void
  setCutting: (cut: { from: { x: number; y: number }; to: { x: number; y: number } } | null) => void
  selectNode: (id: string, multi?: boolean) => void
  clearSelection: () => void
  setHoveredNode: (id: string | null) => void
  setActiveMode: (mode: 'css' | 'js') => void
  setViewBox: (vb: Partial<{ x: number; y: number; zoom: number }>) => void
  setShowCodePanel: (show: boolean) => void
  setShowPalette: (show: boolean) => void
  setContextMenu: (menu: { x: number; y: number; nodeId: string } | null) => void
  loadGraph: (nodes: VisualNode[], connections: NodeConnection[]) => void
  clearGraph: () => void

  loadFiles: () => void
  serializeFiles: () => NodeEditorFile[]
  getCompilableNodes: (category: 'css' | 'js') => { nodes: VisualNode[]; connections: NodeConnection[] }
}

export const useNodeEditorStore = create<NodeEditorState>((set, get) => {
  function deriveFromActiveFile(files: NodeEditorFile[], activeFileId: string | null): Partial<NodeEditorState> {
    const file = files.find((f) => f.id === activeFileId)
    if (file) {
      return { nodes: file.nodes, connections: file.connections, activeMode: file.category }
    }
    return { nodes: [], connections: [], activeMode: 'css' }
  }

  function saveActiveFile(
    files: NodeEditorFile[],
    activeFileId: string | null,
    nodes: VisualNode[],
    connections: NodeConnection[],
  ): NodeEditorFile[] {
    if (!activeFileId) return files
    return files.map((f) => (f.id === activeFileId ? { ...f, nodes, connections } : f))
  }

  return {
    files: loadFilesFromStorage(),
    activeFileId: null,
    activeMode: 'css',
    selectedNodeIds: [],
    hoveredNodeId: null,
    connecting: null,
    cutting: null,
    viewBox: { x: 0, y: 0, zoom: 1 },
    showCodePanel: true,
    showPalette: true,
    contextMenu: null,
    nodes: [],
    connections: [],

    addFile: (name, category) => {
      const id = uuid()
      set((s) => {
        const newFile: NodeEditorFile = { id, name, category, nodes: [], connections: [] }
        const files = [...s.files, newFile]
        persistFiles(files)
        const derived = deriveFromActiveFile(files, id)
        return { files, activeFileId: id, ...derived }
      })
      return id
    },

    removeFile: (id) => {
      set((s) => {
        if (s.files.length <= 1) return {}
        const files = s.files.filter((f) => f.id !== id)
        const newActiveId = s.activeFileId === id ? files[0].id : s.activeFileId
        persistFiles(files)
        const derived = deriveFromActiveFile(files, newActiveId)
        return { files, activeFileId: newActiveId, ...derived, selectedNodeIds: [] }
      })
    },

    renameFile: (id, name) => {
      set((s) => {
        const files = s.files.map((f) => (f.id === id ? { ...f, name } : f))
        persistFiles(files)
        return { files }
      })
    },

    setActiveFile: (id) => {
      set((s) => {
        const derived = deriveFromActiveFile(s.files, id)
        return { activeFileId: id, ...derived, selectedNodeIds: [] }
      })
    },

    getActiveFile: () => {
      return get().files.find((f) => f.id === get().activeFileId)
    },

    addNode: (type, category, label, x, y, inputs, outputs, params) => {
      const id = uuid()
      set((s) => {
        const node: VisualNode = { id, type, category, label, x, y, inputs, outputs, params: { ...params } }
        const nodes = [...s.nodes, node]
        const files = saveActiveFile(s.files, s.activeFileId, nodes, s.connections)
        persistFiles(files)
        return { nodes, files }
      })
      return id
    },

    updateNode: (id, patch) => {
      set((s) => {
        const nodes = s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n))
        const files = saveActiveFile(s.files, s.activeFileId, nodes, s.connections)
        persistFiles(files)
        return { nodes, files }
      })
    },

    moveNode: (id, x, y) => {
      set((s) => {
        const nodes = s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n))
        const files = saveActiveFile(s.files, s.activeFileId, nodes, s.connections)
        return { nodes, files }
      })
    },

    removeNodes: (ids) => {
      const idSet = new Set(ids)
      set((s) => {
        const nodes = s.nodes.filter((n) => !idSet.has(n.id))
        const connections = s.connections.filter(
          (c) => !idSet.has(c.fromNode) && !idSet.has(c.toNode),
        )
        const files = saveActiveFile(s.files, s.activeFileId, nodes, connections)
        persistFiles(files)
        return {
          nodes,
          connections,
          files,
          selectedNodeIds: s.selectedNodeIds.filter((sid) => !idSet.has(sid)),
        }
      })
    },

    duplicateNode: (id) => {
      const { nodes, files, activeFileId, connections } = get()
      const node = nodes.find((n) => n.id === id)
      if (!node) return
      const newId = uuid()
      const dup: VisualNode = {
        ...JSON.parse(JSON.stringify(node)),
        id: newId,
        x: node.x + 30,
        y: node.y + 30,
      }
      const newNodes = [...nodes, dup]
      const newFiles = saveActiveFile(files, activeFileId, newNodes, connections)
      persistFiles(newFiles)
      set({ nodes: newNodes, files: newFiles, selectedNodeIds: [newId] })
    },

    addConnection: (fromNode, fromPort, toNode, toPort) => {
      set((s) => {
        const exists = s.connections.some(
          (c) =>
            c.fromNode === fromNode &&
            c.fromPort === fromPort &&
            c.toNode === toNode &&
            c.toPort === toPort,
        )
        if (exists) return {}
        const conn: NodeConnection = {
          id: uuid(),
          fromNode,
          fromPort,
          toNode,
          toPort,
        }
        const connections = [...s.connections, conn]
        const files = saveActiveFile(s.files, s.activeFileId, s.nodes, connections)
        return { connections, files }
      })
    },

    removeConnection: (id) => {
      set((s) => {
        const connections = s.connections.filter((c) => c.id !== id)
        const files = saveActiveFile(s.files, s.activeFileId, s.nodes, connections)
        return { connections, files }
      })
    },

    splitConnection: (connId, midX, midY) => {
      set((s) => {
        const conn = s.connections.find((c) => c.id === connId)
        if (!conn) return {}

        const rerouteId = uuid()
        const fromNode = s.nodes.find((n) => n.id === conn.fromNode)
        const toNode = s.nodes.find((n) => n.id === conn.toNode)

        const reroute: VisualNode = {
          id: rerouteId,
          type: 'reroute',
          category: fromNode?.category || 'css',
          label: '',
          x: midX - 5,
          y: midY - 5,
          inputs: [
            {
              id: 'in',
              label: '',
              type: toNode?.inputs.find((p) => p.id === conn.toPort)?.type || 'string',
              direction: 'input',
            },
          ],
          outputs: [
            {
              id: 'out',
              label: '',
              type: fromNode?.outputs.find((p) => p.id === conn.fromPort)?.type || 'string',
              direction: 'output',
            },
          ],
          params: {},
        }

        const nodes = [...s.nodes, reroute]
        const connections = [
          ...s.connections.filter((c) => c.id !== connId),
          {
            id: uuid(),
            fromNode: conn.fromNode,
            fromPort: conn.fromPort,
            toNode: rerouteId,
            toPort: 'in',
          },
          {
            id: uuid(),
            fromNode: rerouteId,
            fromPort: 'out',
            toNode: conn.toNode,
            toPort: conn.toPort,
          },
        ]
        const files = saveActiveFile(s.files, s.activeFileId, nodes, connections)
        persistFiles(files)
        return { nodes, connections, files }
      })
    },

    setConnecting: (conn) => set({ connecting: conn }),
    setCutting: (cut) => set({ cutting: cut }),

    selectNode: (id, multi) => {
      set((s) => {
        if (multi) {
          const has = s.selectedNodeIds.includes(id)
          return {
            selectedNodeIds: has
              ? s.selectedNodeIds.filter((sid) => sid !== id)
              : [...s.selectedNodeIds, id],
          }
        }
        return { selectedNodeIds: [id] }
      })
    },

    clearSelection: () => set({ selectedNodeIds: [] }),
    setHoveredNode: (id) => set({ hoveredNodeId: id }),

    setActiveMode: (mode) => {
      set((s) => {
        const files = s.files.map((f) =>
          f.category === mode ? f : { ...f },
        )
        const file = files.find((f) => f.category === mode)
        if (file) {
          const derived = deriveFromActiveFile(files, file.id)
          return { activeMode: mode, activeFileId: file.id, ...derived }
        }
        return { activeMode: mode }
      })
    },

    setViewBox: (vb) => set((s) => ({ viewBox: { ...s.viewBox, ...vb } })),
    setShowCodePanel: (show) => set({ showCodePanel: show }),
    setShowPalette: (show) => set({ showPalette: show }),
    setContextMenu: (menu) => set({ contextMenu: menu }),

    loadGraph: (nodes, connections) => {
      set((s) => {
        const files = saveActiveFile(s.files, s.activeFileId, nodes, connections)
        persistFiles(files)
        return { nodes, connections, files }
      })
    },

    clearGraph: () => {
      set((s) => {
        const files = saveActiveFile(s.files, s.activeFileId, [], [])
        persistFiles(files)
        return { nodes: [], connections: [], files, selectedNodeIds: [] }
      })
    },

    loadFiles: () => {
      let files = loadFilesFromStorage()
      if (files.length === 0) {
        files = createDefaultFiles()
        persistFiles(files)
      }
      const activeFileId = files[0].id
      const derived = deriveFromActiveFile(files, activeFileId)
      set({ files, activeFileId, ...derived })
    },

    serializeFiles: () => {
      // Save current state first, then return files
      const { files, activeFileId, nodes, connections } = get()
      const synced = saveActiveFile(files, activeFileId, nodes, connections)
      persistFiles(synced)
      return synced
    },

    getCompilableNodes: (category) => {
      const { files, activeFileId, nodes, connections } = get()
      const synced = saveActiveFile(files, activeFileId, nodes, connections)
      const catFiles = synced.filter((f) => f.category === category)
      const allNodes = catFiles.flatMap((f) => f.nodes)
      const nodeIds = new Set(allNodes.map((n) => n.id))
      const allConns = catFiles.flatMap((f) =>
        f.connections.filter((c) => nodeIds.has(c.fromNode) && nodeIds.has(c.toNode)),
      )
      return { nodes: allNodes, connections: allConns }
    },
  }
})
