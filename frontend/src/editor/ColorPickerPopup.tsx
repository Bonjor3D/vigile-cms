import { useState, useRef, useEffect } from 'react'
import { useSettingsStore } from '../stores/settings.ts'

const PRESET_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130',
]

interface ColorPickerPopupProps {
  value: string
  onChange: (color: string) => void
  onClose: () => void
}

export function ColorPickerPopup({ value, onChange, onClose }: ColorPickerPopupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [customColor, setCustomColor] = useState(value)
  const [showVars, setShowVars] = useState(false)
  const themeVars = useSettingsStore((s) => s.themeVars)
  const currentTheme = useSettingsStore((s) => s.currentTheme)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    setTimeout(() => window.addEventListener('click', handleClick), 0)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2.5 w-[212px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-10 gap-0.5 mb-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-[18px] h-[18px] rounded-sm border ${
              value === color ? 'border-indigo-500 ring-1 ring-indigo-300' : 'border-gray-200'
            } hover:scale-110 transition-transform`}
            style={{ backgroundColor: color }}
            type="button"
            title={color}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 border-t border-gray-100 pt-2">
        <input
          type="color"
          value={customColor}
          onChange={(e) => {
            setCustomColor(e.target.value)
            onChange(e.target.value)
          }}
          className="w-7 h-7 rounded cursor-pointer p-0.5 border border-gray-200"
        />
        <input
          type="text"
          value={customColor}
          onChange={(e) => {
            setCustomColor(e.target.value)
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
              onChange(e.target.value)
            }
          }}
          className="flex-1 text-[11px] px-1.5 py-1 border border-gray-200 rounded font-mono"
          placeholder="#000000"
        />
      </div>

      {themeVars.length > 0 && (
        <div className="border-t border-gray-100 pt-2 mt-2">
          <button
            onClick={() => setShowVars(!showVars)}
            className="text-[10px] text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
            type="button"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
            Theme Variables
            <svg className={`w-2.5 h-2.5 transition-transform ${showVars ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
          </button>
          {showVars && (
            <div className="mt-1.5 space-y-0.5 max-h-32 overflow-auto">
              {themeVars.map((v) => (
                <button
                  key={v.name}
                  onClick={() => {
                    onChange(`var(--${v.name})`)
                    setShowVars(false)
                    onClose()
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 text-[10px] text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  type="button"
                >
                  <span className="w-3 h-3 rounded border border-gray-200 shrink-0" style={{ backgroundColor: currentTheme === 'dark' ? v.dark : v.light }} />
                  <span className="font-mono">--{v.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
