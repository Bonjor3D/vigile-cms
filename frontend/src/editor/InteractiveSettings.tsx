import { useEditorStore } from '../stores/editor.ts'
import type { ComponentNode } from '../types/component.ts'

interface InteractiveSettingsProps {
  elementId: string
}

export function InteractiveSettings({ elementId }: InteractiveSettingsProps) {
  const { currentPage, updateElement } = useEditorStore()

  function findNode(id: string, node: ComponentNode): ComponentNode | null {
    if (node.id === id) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(id, child)
        if (found) return found
      }
    }
    return null
  }

  const node = currentPage ? findNode(elementId, currentPage.root) : null
  if (!node) return <div className="text-xs text-gray-400 p-4">Select an interactive element</div>

  const attrs = node.attributes || {}

  const inputClass = "w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors"
  const labelClass = "text-[11px] font-medium text-gray-500 block mb-0.5"
  const checkboxClass = "w-3.5 h-3.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"

  const setAttr = (key: string, value: string | boolean | number | undefined) => {
    updateElement(elementId, { attributes: { ...attrs, [key]: value } })
  }

  return (
    <div className="p-3 space-y-3">
      {node.tag === 'a' && (
        <label className={labelClass}>
          Link URL
          <input type="text" value={(attrs.href as string) || ''} onChange={(e) => setAttr('href', e.target.value)} className={inputClass} placeholder="https://..." />
        </label>
      )}

      {node.tag === 'button' && (
        <label className={labelClass}>
          Button Type
          <select value={(attrs.type as string) || 'button'} onChange={(e) => setAttr('type', e.target.value)} className={inputClass}>
            <option value="button">Button</option>
            <option value="submit">Submit</option>
            <option value="reset">Reset</option>
          </select>
        </label>
      )}

      {node.tag === 'input' && (
        <>
          <label className={labelClass}>
            Input Type
            <select value={(attrs.type as string) || 'text'} onChange={(e) => setAttr('type', e.target.value)} className={inputClass}>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="password">Password</option>
              <option value="number">Number</option>
              <option value="tel">Tel</option>
              <option value="url">URL</option>
            </select>
          </label>
          <label className={labelClass}>
            Placeholder
            <input type="text" value={(attrs.placeholder as string) || ''} onChange={(e) => setAttr('placeholder', e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Name
            <input type="text" value={(attrs.name as string) || ''} onChange={(e) => setAttr('name', e.target.value)} className={inputClass} />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!attrs.required}
              onChange={(e) => setAttr('required', e.target.checked || undefined)}
              className={checkboxClass}
            />
            <span className={labelClass}>Required</span>
          </label>
          <label className={labelClass}>
            Min Length
            <input type="number" value={(attrs.minLength as number) || ''} onChange={(e) => setAttr('minLength', e.target.value ? parseInt(e.target.value) : undefined)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Max Length
            <input type="number" value={(attrs.maxLength as number) || ''} onChange={(e) => setAttr('maxLength', e.target.value ? parseInt(e.target.value) : undefined)} className={inputClass} />
          </label>
        </>
      )}

      {node.tag === 'textarea' && (
        <>
          <label className={labelClass}>
            Placeholder
            <input type="text" value={(attrs.placeholder as string) || ''} onChange={(e) => setAttr('placeholder', e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Name
            <input type="text" value={(attrs.name as string) || ''} onChange={(e) => setAttr('name', e.target.value)} className={inputClass} />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!attrs.required}
              onChange={(e) => setAttr('required', e.target.checked || undefined)}
              className={checkboxClass}
            />
            <span className={labelClass}>Required</span>
          </label>
          <label className={labelClass}>
            Rows
            <input type="number" min="1" max="20" value={(attrs.rows as number) || 4} onChange={(e) => setAttr('rows', parseInt(e.target.value) || 4)} className={inputClass} />
          </label>
        </>
      )}

      <div className={labelClass}>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!attrs.disabled}
            onChange={(e) => setAttr('disabled', e.target.checked || undefined)}
            className={checkboxClass}
          />
          <span>Disabled</span>
        </label>
      </div>
    </div>
  )
}
