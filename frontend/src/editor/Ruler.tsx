import { useRef, useState, useCallback, useEffect } from 'react'
import { setBlockAttr } from './EditorExtensions.ts'

interface RulerProps {
  editor: any
}

const TICK_INTERVAL = 10
const PX_PER_TICK = 10

export function Ruler({ editor }: RulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null)
  const [firstLineIndent, setFirstLineIndent] = useState(0)
  const [leftIndent, setLeftIndent] = useState(0)
  const [dragging, setDragging] = useState<'firstLine' | 'leftIndent' | null>(null)

  const getPosFromEvent = useCallback((clientX: number) => {
    if (!rulerRef.current) return 0
    const rect = rulerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    return Math.max(0, Math.min(Math.round(x / PX_PER_TICK) * TICK_INTERVAL, 400))
  }, [])

  const handleMouseDown = useCallback((type: 'firstLine' | 'leftIndent') => (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(type)
    const pos = getPosFromEvent(e.clientX)
    if (type === 'firstLine') {
      setFirstLineIndent(pos)
      setBlockAttr(editor, 'firstLineIndent', pos)
    } else {
      setLeftIndent(pos)
      setBlockAttr(editor, 'indent', pos)
    }
  }, [getPosFromEvent, editor])

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getPosFromEvent(e.clientX)
      if (dragging === 'firstLine') {
        setFirstLineIndent(pos)
        setBlockAttr(editor, 'firstLineIndent', pos)
      } else {
        setLeftIndent(pos)
        setBlockAttr(editor, 'indent', pos)
      }
    }

    const handleMouseUp = () => {
      setDragging(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, getPosFromEvent, editor])

  const marks: React.ReactNode[] = []
  for (let i = TICK_INTERVAL; i <= 400; i += TICK_INTERVAL) {
    const left = (i / TICK_INTERVAL) * PX_PER_TICK
    const isMajor = i % 50 === 0
    marks.push(
      <div
        key={i}
        className="absolute bottom-0"
        style={{ left: `${left}px` }}
      >
        <div className={`bg-gray-300 ${isMajor ? 'w-px h-3' : 'w-px h-1.5'}`} />
        {isMajor && (
          <span className="absolute -top-2 left-0.5 text-[8px] text-gray-400 select-none">{i}</span>
        )}
      </div>
    )
  }

  return (
    <div
      ref={rulerRef}
      className="relative h-5 bg-gray-50 border-b border-gray-200 select-none overflow-hidden shrink-0"
    >
      {marks}

      <div
        className="absolute bottom-0 z-10 cursor-col-resize"
        style={{ left: `${leftIndent}px` }}
        onMouseDown={handleMouseDown('leftIndent')}
      >
        <svg width="10" height="14" viewBox="0 0 10 14" className="text-indigo-500">
          <rect x="0" y="4" width="10" height="10" fill="currentColor" rx="1" />
          <polygon points="5,0 1,4 9,4" fill="currentColor" />
        </svg>
      </div>

      <div
        className="absolute bottom-0 z-10 cursor-col-resize"
        style={{ left: `${firstLineIndent}px` }}
        onMouseDown={handleMouseDown('firstLine')}
      >
        <svg width="10" height="14" viewBox="0 0 10 14" className="text-indigo-400">
          <polygon points="5,0 0,8 10,8" fill="currentColor" />
          <rect x="3" y="8" width="4" height="6" fill="currentColor" rx="1" />
        </svg>
      </div>
    </div>
  )
}
