import { create } from 'zustand'
import type { Page, ComponentNode } from '../types/component.ts'
import { useHistoryStore } from './history.ts'
import { v4 as uuid } from 'uuid'
import { getDefaultPreset } from '../editor/ViewportPresets.ts'

interface EditorState {
  isEditMode: boolean
  selectedElementId: string | null
  hoveredElementId: string | null
  currentPage: Page | null
  editMode: 'page' | 'header' | 'footer'
  breakpoint: 'desktop' | 'tablet' | 'mobile'
  draggedElement: ComponentNode | null
  clipboardNode: ComponentNode | null

  zoom: number
  viewportWidth: number
  viewportHeight: number

  panX: number
  panY: number

  setEditMode: (mode: boolean) => void
  toggleEditMode: () => void
  selectElement: (id: string | null) => void
  hoverElement: (id: string | null) => void
  setCurrentPage: (page: Page | null) => void
  setEditTarget: (target: 'page' | 'header' | 'footer') => void
  setBreakpoint: (bp: 'desktop' | 'tablet' | 'mobile') => void
  setDraggedElement: (el: ComponentNode | null) => void
  setZoom: (z: number) => void
  setViewportSize: (w: number, h: number) => void
  setPan: (x: number, y: number) => void
  panBy: (dx: number, dy: number) => void
  updateElement: (id: string, patch: Partial<ComponentNode>) => void
  moveElement: (activeId: string, overId: string) => void
  reparentElement: (activeId: string, parentId: string) => void
  deleteElement: (id: string) => void
  duplicateElement: (id: string) => void
  addElementAfter: (targetId: string, type: string, tag: string) => void
  addChild: (parentId: string, type: string, tag: string) => void
  insertNode: (parentId: string, node: ComponentNode) => void
  copyNode: (node: ComponentNode) => void
  pasteNode: () => void
}

function cloneNode(node: ComponentNode): ComponentNode {
  return JSON.parse(JSON.stringify(node))
}

function stripInteractiveText(node: ComponentNode): ComponentNode {
  if ((node.tag === 'button' || node.tag === 'a') && node.children && node.children.length > 0 && node.text) {
    return { ...node, text: undefined, children: node.children.map(stripInteractiveText) }
  }
  if (node.children) {
    return { ...node, children: node.children.map(stripInteractiveText) }
  }
  return node
}

export const useEditorStore = create<EditorState>((set, get) => ({
  isEditMode: false,
  selectedElementId: null,
  hoveredElementId: null,
  currentPage: null,
  editMode: 'page',
  breakpoint: 'desktop',
  draggedElement: null,
  clipboardNode: null,
  zoom: 100,
  viewportWidth: 1920,
  viewportHeight: 1080,

  panX: 0,
  panY: 0,

  setEditMode: (mode) => set({ isEditMode: mode, selectedElementId: mode ? get().selectedElementId : null }),
  toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode, selectedElementId: s.isEditMode ? null : s.selectedElementId })),

  selectElement: (id) => set({ selectedElementId: id }),
  hoverElement: (id) => set({ hoveredElementId: id }),

  setCurrentPage: (page) => set({ currentPage: page }),

  setEditTarget: (target) => set({ editMode: target }),
  setBreakpoint: (bp) => {
    const preset = getDefaultPreset(bp)
    set({ breakpoint: bp, viewportWidth: preset.width, viewportHeight: preset.height })
  },

  setDraggedElement: (el) => set({ draggedElement: el }),
  setZoom: (z) => set({ zoom: Math.max(10, Math.min(200, z)) }),
  setViewportSize: (w, h) => set({ viewportWidth: w, viewportHeight: h }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  panBy: (dx, dy) => set((s) => ({ panX: s.panX + dx, panY: s.panY + dy })),

  updateElement: (id, patch) => {
    const page = get().currentPage
    if (!page) return

    const updateNode = (node: ComponentNode): ComponentNode => {
      if (node.id === id) return { ...node, ...patch }
      if (node.children) return { ...node, children: node.children.map(updateNode) }
      return node
    }

    const newRoot = updateNode(page.root)
    useHistoryStore.getState().pushSnapshot(newRoot)
    set({ currentPage: { ...page, root: newRoot } })
  },

  moveElement: (activeId, overId) => {
    const page = get().currentPage
    if (!page || activeId === overId) return

    const root = cloneNode(page.root)

    const findParent = (node: ComponentNode, childId: string): { parent: ComponentNode; index: number } | null => {
      if (!node.children) return null
      const idx = node.children.findIndex(c => c.id === childId)
      if (idx !== -1) return { parent: node, index: idx }
      for (const child of node.children) {
        const found = findParent(child, childId)
        if (found) return found
      }
      return null
    }

    const activeParentInfo = findParent(root, activeId)
    if (!activeParentInfo || !activeParentInfo.parent.children) return

    const [moved] = activeParentInfo.parent.children.splice(activeParentInfo.index, 1)

    const overParentInfo = findParent(root, overId)
    if (!overParentInfo) {
      root.children = root.children || []
      root.children.push(moved)
    } else if (overParentInfo.parent.children) {
      overParentInfo.parent.children.splice(overParentInfo.index + 1, 0, moved)
    }

    const cleaned = stripInteractiveText(root)
    useHistoryStore.getState().pushSnapshot(cleaned)
    set({ currentPage: { ...page, root: cleaned } })
  },

  reparentElement: (activeId, parentId) => {
    const page = get().currentPage
    if (!page || activeId === parentId) return

    const root = cloneNode(page.root)

    const findNode = (node: ComponentNode, id: string): ComponentNode | null => {
      if (node.id === id) return node
      if (!node.children) return null
      for (const child of node.children) {
        const found = findNode(child, id)
        if (found) return found
      }
      return null
    }

    const findParent = (node: ComponentNode, childId: string): { parent: ComponentNode; index: number } | null => {
      if (!node.children) return null
      const idx = node.children.findIndex(c => c.id === childId)
      if (idx !== -1) return { parent: node, index: idx }
      for (const child of node.children) {
        const found = findParent(child, childId)
        if (found) return found
      }
      return null
    }

    const parent = findNode(root, parentId)
    if (!parent) return

    const activeParentInfo = findParent(root, activeId)
    if (!activeParentInfo || !activeParentInfo.parent.children) return

    const activeNode = findNode(root, activeId)
    if (!activeNode) return

    if (findNode(activeNode, parentId)) return

    const [moved] = activeParentInfo.parent.children.splice(activeParentInfo.index, 1)
    parent.children = parent.children || []
    parent.children.unshift(moved)

    const cleaned = stripInteractiveText(root)
    useHistoryStore.getState().pushSnapshot(cleaned)
    set({ currentPage: { ...page, root: cleaned } })
  },

  deleteElement: (id) => {
    const page = get().currentPage
    if (!page) return

    if (id === page.root.id) return

    const removeChild = (node: ComponentNode): ComponentNode | null => {
      if (!node.children) return null
      const idx = node.children.findIndex(c => c.id === id)
      if (idx !== -1) {
        return {
          ...node,
          children: [...node.children.slice(0, idx), ...node.children.slice(idx + 1)],
        }
      }
      let changed = false
      const newChildren = node.children.map(c => {
        const result = removeChild(c)
        if (result) { changed = true; return result }
        return c
      })
      return changed ? { ...node, children: newChildren } : null
    }

    const newRoot = removeChild(page.root) || page.root
    useHistoryStore.getState().pushSnapshot(newRoot)
    set({
      currentPage: { ...page, root: newRoot },
      selectedElementId: get().selectedElementId === id ? null : get().selectedElementId,
    })
  },

  duplicateElement: (id) => {
    const page = get().currentPage
    if (!page) return

    const root = cloneNode(page.root)

    const reId = (node: ComponentNode): ComponentNode => ({
      ...node,
      id: uuid(),
      children: node.children?.map(reId),
    })

    const findParent = (node: ComponentNode, childId: string): { parent: ComponentNode; index: number } | null => {
      if (!node.children) return null
      const idx = node.children.findIndex(c => c.id === childId)
      if (idx !== -1) return { parent: node, index: idx }
      for (const child of node.children) {
        const found = findParent(child, childId)
        if (found) return found
      }
      return null
    }

    const parentInfo = findParent(root, id)
    if (!parentInfo || !parentInfo.parent.children) return

    const original = parentInfo.parent.children[parentInfo.index]
    const duplicate = reId(original)
    parentInfo.parent.children.splice(parentInfo.index + 1, 0, duplicate)

    useHistoryStore.getState().pushSnapshot(root)
    set({ currentPage: { ...page, root } })
  },

  addElementAfter: (targetId, type, tag) => {
    const page = get().currentPage
    if (!page) return
    const root = cloneNode(page.root)

    const el: ComponentNode = {
      id: uuid(),
      type,
      tag,
      text: getDefaultText(tag),
      children: [],
      styles: getDefaultStyles(tag),
      classNames: [],
      locked: false,
      hidden: false,
    }

    const findParent = (node: ComponentNode, childId: string): { parent: ComponentNode; index: number } | null => {
      if (!node.children) return null
      const idx = node.children.findIndex(c => c.id === childId)
      if (idx !== -1) return { parent: node, index: idx }
      for (const child of node.children) {
        const found = findParent(child, childId)
        if (found) return found
      }
      return null
    }

    const parentInfo = findParent(root, targetId)
    if (parentInfo && parentInfo.parent.children) {
      parentInfo.parent.children.splice(parentInfo.index + 1, 0, el)
    } else {
      root.children = root.children || []
      root.children.push(el)
    }

    const cleaned = stripInteractiveText(root)
    useHistoryStore.getState().pushSnapshot(cleaned)
    set({ currentPage: { ...page, root: cleaned } })
  },

  addChild: (parentId, type, tag) => {
    const page = get().currentPage
    if (!page) return

    const el: ComponentNode = {
      id: uuid(),
      type,
      tag,
      text: getDefaultText(tag),
      children: [],
      styles: getDefaultStyles(tag),
      classNames: [],
      locked: false,
      hidden: false,
    }

    const addToNode = (node: ComponentNode): ComponentNode => {
      if (node.id === parentId) {
        return { ...node, children: [...(node.children || []), el] }
      }
      if (node.children) return { ...node, children: node.children.map(addToNode) }
      return node
    }

    const newRoot = stripInteractiveText(addToNode(page.root))
    useHistoryStore.getState().pushSnapshot(newRoot)
    set({ currentPage: { ...page, root: newRoot } })
  },

  insertNode: (parentId: string, node: ComponentNode) => {
    const page = get().currentPage
    if (!page) return

    const insertInNode = (n: ComponentNode): ComponentNode => {
      if (n.id === parentId) {
        return { ...n, children: [...(n.children || []), node] }
      }
      if (n.children) return { ...n, children: n.children.map(insertInNode) }
      return n
    }

    const newRoot = stripInteractiveText(insertInNode(page.root))
    useHistoryStore.getState().pushSnapshot(newRoot)
    set({ currentPage: { ...page, root: newRoot } })
  },

  copyNode: (node: ComponentNode) => set({ clipboardNode: node }),
  pasteNode: () => {
    const { clipboardNode, currentPage, selectedElementId } = get()
    if (!clipboardNode || !currentPage) return
    const targetId = selectedElementId || currentPage.root.id
    const pasted = JSON.parse(JSON.stringify(clipboardNode))
    const reId = (n: ComponentNode): ComponentNode => ({
      ...n,
      id: uuid(),
      children: n.children?.map(reId),
    })
    const cloned = reId(pasted)
    get().insertNode(targetId, cloned)
  },
}))

function getDefaultText(tag: string): string | undefined {
  const texts: Record<string, string> = {
    h1: 'Heading', h2: 'Heading', h3: 'Heading', p: 'Paragraph text',
    span: 'Text', button: 'Button', a: 'Link text', li: 'List item',
    blockquote: 'Quote', small: 'Small text', label: 'Label',
  }
  return texts[tag]
}

function getDefaultStyles(tag: string): Record<string, string> {
  const map: Record<string, Record<string, string>> = {
    div: { display: 'block', padding: '0px', margin: '0px' },
    section: { display: 'block', padding: '16px', margin: '0px' },
    h1: { fontSize: '32px', fontWeight: '700', margin: '0px' },
    h2: { fontSize: '24px', fontWeight: '700', margin: '0px' },
    p: { fontSize: '16px', lineHeight: '1.5', margin: '0px' },
    img: { maxWidth: '100%', height: 'auto' },
    button: { padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #d1d5db' },
  }
  return map[tag] || {}
}
