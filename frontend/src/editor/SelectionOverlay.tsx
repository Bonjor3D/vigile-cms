import { useEffect, useState } from 'react'
import { useEditorStore } from '../stores/editor.ts'

interface OverlayProps {
  elementId: string
}

interface ElementRect {
  top: number
  left: number
  width: number
  height: number
}

function getElementRect(elementId: string): ElementRect | null {
  const el = document.querySelector(`[data-element-id="${elementId}"]`)
  const ws = document.getElementById('editor-workspace')
  if (!el || !ws) return null
  const er = el.getBoundingClientRect()
  const wr = ws.getBoundingClientRect()
  const top = Math.max(er.top, wr.top)
  const left = Math.max(er.left, wr.left)
  const right = Math.min(er.right, wr.right)
  const bottom = Math.min(er.bottom, wr.bottom)
  if (right <= left || bottom <= top) return null
  return { top, left, width: right - left, height: bottom - top }
}

export function SelectionOverlay({ elementId }: OverlayProps) {
  const [rect, setRect] = useState<ElementRect | null>(null)
  const { currentPage, editMode, breakpoint } = useEditorStore()

  useEffect(() => {
    const ws = document.getElementById('editor-workspace')

    const update = () => {
      const next = getElementRect(elementId)
      setRect(prev => {
        if (prev && next &&
            prev.top === next.top && prev.left === next.left &&
            prev.width === next.width && prev.height === next.height)
          return prev
        return next
      })
    }

    const el = document.querySelector(`[data-element-id="${elementId}"]`)
    if (!el) return

    const observer = new ResizeObserver(update)
    observer.observe(el)

    if (ws) ws.addEventListener('scroll', update, { passive: true })

    let rafId: number
    const loop = () => {
      update()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    return () => {
      observer.disconnect()
      if (ws) ws.removeEventListener('scroll', update)
      cancelAnimationFrame(rafId)
    }
  }, [elementId, currentPage, editMode, breakpoint])

  if (!rect) return null

  return (
    <>
      <div
        className="fixed pointer-events-none border-2 border-indigo-500 bg-indigo-500/10 z-10"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      >
        <div className="absolute -top-5 left-0 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-t whitespace-nowrap">
          {elementId.slice(0, 8)}
        </div>
      </div>

      <div
        className="fixed w-2 h-2 bg-white border-2 border-indigo-500 rounded-sm z-20 cursor-nw-resize"
        style={{ top: rect.top - 4, left: rect.left - 4 }}
      />
      <div
        className="fixed w-2 h-2 bg-white border-2 border-indigo-500 rounded-sm z-20 cursor-ne-resize"
        style={{ top: rect.top - 4, left: rect.left + rect.width - 4 }}
      />
      <div
        className="fixed w-2 h-2 bg-white border-2 border-indigo-500 rounded-sm z-20 cursor-sw-resize"
        style={{ top: rect.top + rect.height - 4, left: rect.left - 4 }}
      />
      <div
        className="fixed w-2 h-2 bg-white border-2 border-indigo-500 rounded-sm z-20 cursor-se-resize"
        style={{ top: rect.top + rect.height - 4, left: rect.left + rect.width - 4 }}
      />
    </>
  )
}
