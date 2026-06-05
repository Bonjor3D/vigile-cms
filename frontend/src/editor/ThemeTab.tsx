import { useState } from 'react'
import { useSettingsStore } from '../stores/settings.ts'
import type { ThemeVariable } from '../types/component.ts'

export function ThemeTab() {
  const store = useSettingsStore()
  const [vars, setVars] = useState<ThemeVariable[]>(() => JSON.parse(JSON.stringify(store.themeVars)))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const update = (i: number, patch: Partial<ThemeVariable>) => {
    setVars((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], ...patch }
      return next
    })
    setDirty(true)
    setSaveError('')
  }

  const add = () => {
    setVars((prev) => [...prev, { name: '', light: '#ffffff', dark: '#1f2937' }])
    setDirty(true)
    setSaveError('')
  }

  const remove = (i: number) => {
    setVars((prev) => prev.filter((_, idx) => idx !== i))
    setDirty(true)
    setSaveError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    // Save to localStorage immediately (always works)
    store.setThemeVars(vars)
    setDirty(false)
    // Then try API (async, don't block on failure)
    try {
      await store.updateThemeVars(vars)
    } catch {
      setSaveError('Server save failed, but changes are saved locally')
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setVars(JSON.parse(JSON.stringify(store.themeVars)))
    setDirty(false)
    setSaveError('')
  }

  const inp = "w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors bg-white"

  return (
    <div className="p-3 space-y-3 text-xs">
      {/* Theme toggle */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <span className="font-medium text-gray-700">Theme</span>
        <button
          id="global-theme-switch"
          onClick={store.toggleTheme}
          className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
            store.currentTheme === 'dark'
              ? 'bg-gray-800 text-white border-gray-700'
              : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          {store.currentTheme === 'light' ? '☀ Light' : '☾ Dark'}
        </button>
      </div>

      {/* Custom vars */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Custom Variables</h3>
          <button
            onClick={add}
            className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
          >
            + Add
          </button>
        </div>

        {vars.length === 0 && (
          <p className="text-gray-400 text-center py-4">No custom variables defined.</p>
        )}

        <div className="space-y-2">
          {vars.map((v, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={v.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-indigo-400 transition-colors bg-white"
                  placeholder="--variable-name"
                />
                <span className="text-gray-400 text-[10px] font-mono">--{v.name || 'name'}</span>
                <button
                  onClick={() => remove(i)}
                  className="text-gray-400 hover:text-red-500 shrink-0 px-1"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] text-gray-500 block">
                  Light
                  <div className="flex gap-1 mt-0.5">
                    <input
                      type="color"
                      value={v.light}
                      onChange={(e) => update(i, { light: e.target.value })}
                      className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={v.light}
                      onChange={(e) => update(i, { light: e.target.value })}
                      className={inp}
                      placeholder="#ffffff"
                    />
                  </div>
                </label>
                <label className="text-[10px] text-gray-500 block">
                  Dark
                  <div className="flex gap-1 mt-0.5">
                    <input
                      type="color"
                      value={v.dark}
                      onChange={(e) => update(i, { dark: e.target.value })}
                      className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={v.dark}
                      onChange={(e) => update(i, { dark: e.target.value })}
                      className={inp}
                      placeholder="#1f2937"
                    />
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {saveError && (
        <p className="text-amber-600 text-[10px] text-center">{saveError}</p>
      )}

      {dirty && (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 text-xs font-medium bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Variables'}
          </button>
          <button
            onClick={handleCancel}
            className="py-2 px-4 text-xs font-medium border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
