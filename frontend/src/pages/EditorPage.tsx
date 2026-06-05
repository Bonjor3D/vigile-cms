import { useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useEditorStore } from '../stores/editor.ts'
import { usePageStore } from '../stores/page.ts'
import { useSettingsStore } from '../stores/settings.ts'
import { useHistoryStore } from '../stores/history.ts'
import { EditorLayout } from '../editor/EditorLayout.tsx'
import { registerDefaultElements } from '../renderer/ComponentRegistry.ts'
import { createDefaultRoot, createDefaultHeader, createDefaultFooter } from '../utils/element-factory.ts'

registerDefaultElements()

function makeFakePage(slug: string, title: string, root: import('../types/component.ts').ComponentNode) {
  return {
    id: `__${slug}__`,
    title,
    slug,
    visibility: 'published' as const,
    sortOrder: -2,
    root,
    createdAt: '',
    updatedAt: '',
  }
}

export function EditorPage() {
  const { slug } = useParams<{ slug: string }>()
  const { currentPage, setCurrentPage, isEditMode, selectedElementId, deleteElement, duplicateElement, editMode, setEditTarget } = useEditorStore()
  const { fetchPage, savePage } = usePageStore()
  const { fetchSettings, saveHeader, saveFooter, elements, saveElement } = useSettingsStore()
  const { pushSnapshot } = useHistoryStore()
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    if (!slug) return

    if (slug === 'header' || slug === 'footer') {
      fetchSettings().then(async () => {
        const isHeader = slug === 'header'
        let node = isHeader ? useSettingsStore.getState().header : useSettingsStore.getState().footer
        if (!node) {
          node = isHeader ? createDefaultHeader() : createDefaultFooter()
          if (isHeader) {
            useSettingsStore.getState().saveHeader(node)
          } else {
            useSettingsStore.getState().saveFooter(node)
          }
        }
        setCurrentPage(makeFakePage(slug, isHeader ? 'Header' : 'Footer', node))
        pushSnapshot(node)
        setEditTarget(isHeader ? 'header' : 'footer')
      })
    } else if (slug?.startsWith('element-')) {
      const elementId = slug.slice(8)
      const el = useSettingsStore.getState().elements.find((e) => e.id === elementId)
      if (el) {
        setCurrentPage(makeFakePage(slug, el.text || 'Element', el))
        pushSnapshot(el)
        setEditTarget('page')
      }
    } else {
      fetchPage(slug).then((page) => {
        if (page) {
          setCurrentPage(page)
          pushSnapshot(page.root)
          setEditTarget('page')
        }
      })
    }
  }, [slug, fetchPage, setCurrentPage, pushSnapshot, fetchSettings, setEditTarget])

  // Watch editTarget switching (dropdown in EditHeader)
  useEffect(() => {
    if (!slug) return
    if (slug === 'header' || slug === 'footer') return
    if (!currentPage) return
    // Only act when switching away from current page
    if (editMode === 'page' && currentPage.slug === slug) return
    if (editMode === 'header' && currentPage.slug === 'header') return
    if (editMode === 'footer' && currentPage.slug === 'footer') return

    if (editMode === 'header') {
      let h = useSettingsStore.getState().header
      if (!h) {
        h = createDefaultHeader()
        useSettingsStore.getState().saveHeader(h)
      }
      setCurrentPage(makeFakePage('header', 'Header', h))
      pushSnapshot(h)
    } else if (editMode === 'footer') {
      let f = useSettingsStore.getState().footer
      if (!f) {
        f = createDefaultFooter()
        useSettingsStore.getState().saveFooter(f)
      }
      setCurrentPage(makeFakePage('footer', 'Footer', f))
      pushSnapshot(f)
    } else if (editMode === 'page') {
      fetchPage(slug).then((page) => {
        if (page) {
          setCurrentPage(page)
          pushSnapshot(page.root)
        }
      })
    }
  }, [editMode, slug, setCurrentPage, pushSnapshot, fetchPage])

  const handleSave = useCallback(async () => {
    if (!currentPage) return
    pushSnapshot(currentPage.root)

    if (currentPage.slug === 'header') {
      await saveHeader(currentPage.root)
    } else if (currentPage.slug === 'footer') {
      await saveFooter(currentPage.root)
    } else if (currentPage.slug?.startsWith('element-')) {
      saveElement(currentPage.slug.slice(8), currentPage.root)
    } else {
      await savePage(currentPage)
    }
  }, [currentPage, savePage, saveHeader, saveFooter, pushSnapshot])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode) return

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const { undo } = useHistoryStore.getState()
        const { setCurrentPage, currentPage } = useEditorStore.getState()
        const snapshot = undo()
        if (snapshot && currentPage) {
          setCurrentPage({ ...currentPage, root: snapshot })
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' && e.shiftKey || e.key === 'Z')) {
        e.preventDefault()
        const { redo } = useHistoryStore.getState()
        const { setCurrentPage, currentPage } = useEditorStore.getState()
        const snapshot = redo()
        if (snapshot && currentPage) {
          setCurrentPage({ ...currentPage, root: snapshot })
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementId) {
        e.preventDefault()
        duplicateElement(selectedElementId)
      }

      if (e.key === 'Delete' && selectedElementId) {
        const { isEditMode, currentPage, selectedElementId } = useEditorStore.getState()
        if (isEditMode && selectedElementId && currentPage?.root.id !== selectedElementId) {
          if (window.confirm('Delete this element?')) {
            e.preventDefault()
            deleteElement(selectedElementId)
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, isEditMode, selectedElementId, deleteElement, duplicateElement])

  if (!currentPage) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return <EditorLayout />
}
