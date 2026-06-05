import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { apiFetch } from '../api/client.ts'
import type { ComponentNode, ThemeVariable } from '../types/component.ts'
import { createDefaultHeader, createDefaultFooter, createElement, createTextElement } from '../utils/element-factory.ts'

interface SiteSettingsData {
  id: string
  name: string
  description?: string
  favicon?: string
  globalCss?: string
  globalJs?: string
  themeVariables?: string
  header?: ComponentNode
  footer?: ComponentNode
}

interface SettingsState {
  settings: SiteSettingsData | null
  header: ComponentNode | null
  footer: ComponentNode | null
  elements: ComponentNode[]
  isLoading: boolean
  themeVars: ThemeVariable[]
  currentTheme: 'light' | 'dark'
  fetchSettings: () => Promise<void>
  updateSettings: (data: Partial<SiteSettingsData>) => Promise<void>
  saveHeader: (node: ComponentNode) => Promise<void>
  saveFooter: (node: ComponentNode) => Promise<void>
  createElement: (name: string) => ComponentNode
  saveElement: (id: string, node: ComponentNode) => void
  deleteElement: (id: string) => void
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void
  updateThemeVars: (vars: ThemeVariable[]) => Promise<void>
  setThemeVars: (vars: ThemeVariable[]) => void
}

function loadTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('vigile-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* ignore */ }
  return 'light'
}

function saveTheme(t: 'light' | 'dark') {
  try { localStorage.setItem('vigile-theme', t) } catch { /* ignore */ }
}

const VARS_KEY = 'vigile-theme-vars'
const HEADER_KEY = 'vigile-header'
const FOOTER_KEY = 'vigile-footer'
const ELEMENTS_KEY = 'vigile-elements'

function loadVars(): ThemeVariable[] {
  try {
    const stored = localStorage.getItem(VARS_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return []
}

function persistVars(vars: ThemeVariable[]) {
  try { localStorage.setItem(VARS_KEY, JSON.stringify(vars)) } catch { /* ignore */ }
}

function loadLocalHeader(): ComponentNode | null {
  try {
    const stored = localStorage.getItem(HEADER_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return null
}

function persistLocalHeader(node: ComponentNode) {
  try { localStorage.setItem(HEADER_KEY, JSON.stringify(node)) } catch { /* ignore */ }
}

function loadLocalFooter(): ComponentNode | null {
  try {
    const stored = localStorage.getItem(FOOTER_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return null
}

function persistLocalFooter(node: ComponentNode) {
  try { localStorage.setItem(FOOTER_KEY, JSON.stringify(node)) } catch { /* ignore */ }
}

function loadLocalElements(): ComponentNode[] {
  try {
    const stored = localStorage.getItem(ELEMENTS_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return []
}

function persistLocalElements(nodes: ComponentNode[]) {
  try { localStorage.setItem(ELEMENTS_KEY, JSON.stringify(nodes)) } catch { /* ignore */ }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  header: loadLocalHeader() || createDefaultHeader(),
  footer: loadLocalFooter() || createDefaultFooter(),
  elements: loadLocalElements(),
  isLoading: false,
  themeVars: loadVars(),
  currentTheme: loadTheme(),

  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const res = await apiFetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        let vars: ThemeVariable[] = []
        if (data.themeVariables) {
          try { vars = JSON.parse(data.themeVariables) } catch { /* ignore */ }
        }
        if (vars.length) persistVars(vars)
        set({
          settings: data,
          header: get().header || data.header || null,
          footer: get().footer || data.footer || null,
          themeVars: vars.length ? vars : get().themeVars,
          isLoading: false,
        })
        return
      }
    } catch (e) { console.error('fetchSettings failed', e) }
    set({ isLoading: false })
  },

  updateSettings: async (data) => {
    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        favicon: data.favicon,
        globalCss: data.globalCss,
        globalJs: data.globalJs,
        header: data.header ? JSON.stringify(data.header) : undefined,
        footer: data.footer ? JSON.stringify(data.footer) : undefined,
        themeVariables: data.themeVariables,
      }),
    })
    if (res.ok) {
      set((s) => ({
        settings: s.settings ? { ...s.settings, ...data } : s.settings,
        ...(data.header ? { header: data.header } : {}),
        ...(data.footer ? { footer: data.footer } : {}),
      }))
    }
  },

  saveHeader: async (node) => {
    persistLocalHeader(node)
    set({ header: node })
    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ header: JSON.stringify(node) }),
    })
    if (!res.ok) console.error('saveHeader failed', res.status, await res.text().catch(() => ''))
  },

  saveFooter: async (node) => {
    persistLocalFooter(node)
    set({ footer: node })
    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ footer: JSON.stringify(node) }),
    })
    if (!res.ok) console.error('saveFooter failed', res.status, await res.text().catch(() => ''))
  },

  createElement: (name) => {
    const node = createElement('div', 'div', {
      styles: { display: 'block', padding: '16px', border: '1px dashed #d1d5db', minHeight: '48px' },
      children: [createTextElement('span', 'span', name)],
    })
    const elements = [...get().elements, node]
    persistLocalElements(elements)
    set({ elements })
    return node
  },

  saveElement: (id, node) => {
    const elements = get().elements.map((e) => (e.id === id ? node : e))
    persistLocalElements(elements)
    set({ elements })
  },

  deleteElement: (id) => {
    const elements = get().elements.filter((e) => e.id !== id)
    persistLocalElements(elements)
    set({ elements })
  },

  setTheme: (t) => {
    set({ currentTheme: t })
    saveTheme(t)
  },

  toggleTheme: () => {
    const next = get().currentTheme === 'light' ? 'dark' : 'light'
    set({ currentTheme: next })
    saveTheme(next)
  },

  updateThemeVars: async (vars) => {
    persistVars(vars)
    const json = JSON.stringify(vars)
    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ themeVariables: json }),
    })
    if (res.ok) {
      set({ themeVars: vars, settings: get().settings ? { ...get().settings!, themeVariables: json } : null })
    } else {
      set({ themeVars: vars })
    }
  },

  setThemeVars: (vars) => {
    persistVars(vars)
    set({ themeVars: vars })
  },
}))
