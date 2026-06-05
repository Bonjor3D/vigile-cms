import { useState, useRef, useEffect, useMemo } from 'react'
import { SYMBOL_CATEGORIES, type SymbolCategory } from './symbols.ts'

interface SymbolPickerProps {
  onSelect: (char: string) => void
  onClose: () => void
}

export function SymbolPicker({ onSelect, onClose }: SymbolPickerProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const filtered = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return SYMBOL_CATEGORIES.map((cat) => {
      const matching = cat.symbols.filter((s) => {
        if (s.toLowerCase().includes(q)) return true
        if (cat.name.toLowerCase().includes(q)) return true
        return false
      })
      return { ...cat, symbols: matching }
    }).filter((cat) => cat.symbols.length > 0)
  }, [search])

  const displayCategories = filtered ?? SYMBOL_CATEGORIES
  const current = displayCategories[activeCategory] ?? displayCategories[0]

  const handleCategoryClick = (idx: number) => {
    setActiveCategory(idx)
    gridRef.current?.scrollTo(0, 0)
  }

  const handleSymbolClick = (char: string) => {
    onSelect(char)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 w-[520px] h-[480px] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveCategory(0) }}
            placeholder="Search symbols..."
            className="flex-1 text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400" type="button" title="Close">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-28 shrink-0 overflow-auto border-r border-gray-100 bg-gray-50/50 py-1">
            {displayCategories.map((cat, idx) => (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(idx)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left transition-colors ${
                  idx === activeCategory ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
                type="button"
              >
                <span className="text-sm w-4 text-center">{cat.icon}</span>
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>

          <div ref={gridRef} className="flex-1 overflow-auto p-2">
            {current.symbols.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">No symbols found</div>
            ) : (
              <div className="grid grid-cols-10 gap-0.5">
                {current.symbols.map((char, i) => (
                  <button
                    key={`${char}-${i}`}
                    onClick={() => handleSymbolClick(char)}
                    className="w-9 h-9 flex items-center justify-center text-sm rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-200"
                    type="button"
                    title={char}
                  >
                    {char}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
