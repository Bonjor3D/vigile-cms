import { create } from 'zustand'
import type { ComponentNode } from '../types/component.ts'
import { v4 as uuid } from 'uuid'

const STORAGE_KEY = 'vigile_templates'

interface TemplateEntry {
  id: string
  name: string
  node: ComponentNode
  createdAt: string
}

interface TemplateState {
  templates: TemplateEntry[]
  load: () => void
  add: (name: string, node: ComponentNode) => void
  remove: (id: string) => void
}

function persist(templates: TemplateEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(templates)) } catch { }
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) set({ templates: JSON.parse(raw) })
    } catch { }
  },
  add: (name, node) => {
    const entry: TemplateEntry = { id: uuid(), name, node, createdAt: new Date().toISOString() }
    const next = [...get().templates, entry]
    set({ templates: next })
    persist(next)
  },
  remove: (id) => {
    const next = get().templates.filter((t) => t.id !== id)
    set({ templates: next })
    persist(next)
  },
}))
