import { create } from 'zustand'
import type { ComponentNode } from '../types/component.ts'

interface Snapshot {
  nodes: ComponentNode
  timestamp: number
}

interface HistoryState {
  past: Snapshot[]
  future: Snapshot[]
  pushSnapshot: (nodes: ComponentNode) => void
  undo: () => ComponentNode | null
  redo: () => ComponentNode | null
  clear: () => void
}

const MAX_HISTORY = 50

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  pushSnapshot: (nodes) => {
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY + 1), { nodes: structuredClone(nodes), timestamp: Date.now() }],
      future: [],
    }))
  },

  undo: () => {
    const { past, future } = get()
    if (past.length === 0) return null
    const prev = past[past.length - 1]
    set({
      past: past.slice(0, -1),
      future: [...future, prev],
    })
    return prev.nodes
  },

  redo: () => {
    const { past, future } = get()
    if (future.length === 0) return null
    const next = future[future.length - 1]
    set({
      past: [...past, next],
      future: future.slice(0, -1),
    })
    return next.nodes
  },

  clear: () => set({ past: [], future: [] }),
}))
