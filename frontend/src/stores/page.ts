import { create } from 'zustand'
import type { Page } from '../types/component.ts'
import { apiFetch } from '../api/client.ts'

interface PageState {
  pages: Page[]
  isLoading: boolean
  fetchPages: () => Promise<void>
  fetchPage: (slug: string) => Promise<Page | null>
  fetchPageByEndpoint: (endpoint: string) => Promise<Page | null>
  savePage: (page: Page) => Promise<void>
  createPage: (page: Partial<Page>) => Promise<void>
  deletePage: (id: string) => Promise<void>
}

export const usePageStore = create<PageState>((set) => ({
  pages: [],
  isLoading: false,

  fetchPages: async () => {
    set({ isLoading: true })
    try {
      const res = await apiFetch('/api/pages')
      if (res.ok) {
        const pages = await res.json()
        set({ pages, isLoading: false })
        return
      }
    } catch { /* ignore */ }
    set({ isLoading: false })
  },

  fetchPage: async (slug) => {
    try {
      const res = await apiFetch(`/api/pages/${slug}`)
      if (res.ok) return await res.json()
    } catch { /* ignore */ }
    return null
  },

  fetchPageByEndpoint: async (endpoint: string) => {
    try {
      const res = await apiFetch(`/api/pages/by-endpoint/${endpoint}`)
      if (res.ok) return await res.json()
    } catch { /* ignore */ }
    return null
  },

  savePage: async (page) => {
    await apiFetch(`/api/pages/${page.id}`, {
      method: 'PUT',
      body: JSON.stringify(page),
    })
  },

  createPage: async (page) => {
    const res = await apiFetch('/api/pages', {
      method: 'POST',
      body: JSON.stringify(page),
    })
    if (res.ok) {
      const created = await res.json()
      set((s) => ({ pages: [...s.pages, created] }))
    }
  },

  deletePage: async (id) => {
    await apiFetch(`/api/pages/${id}`, { method: 'DELETE' })
    set((s) => ({ pages: s.pages.filter((p) => p.id !== id) }))
  },
}))
