import { useState, type CSSProperties } from 'react'

interface ParamInputProps {
  name: string
  value: any
  meta?: {
    type: 'string' | 'number' | 'boolean' | 'color' | 'select'
    options?: string[]
    placeholder?: string
  }
  onChange: (name: string, value: any) => void
  hasConnection?: boolean
}

export function ParamInput({ name, value, meta, onChange, hasConnection }: ParamInputProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value ?? ''))

  const handleChange = (newVal: any) => {
    onChange(name, newVal)
  }

  if (hasConnection) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px', opacity: 0.5 } as CSSProperties}>
        <span style={{ fontSize: '9px', color: '#9ca3af', width: '40px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' } as CSSProperties}>
          {name}
        </span>
        <span style={{ fontSize: '9px', color: '#6b7280', fontStyle: 'italic' }}>connected</span>
      </div>
    )
  }

  const inputType = meta?.type
  const options = meta?.options

  if (inputType === 'boolean' || typeof value === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' } as CSSProperties}>
        <span style={{ fontSize: '9px', color: '#9ca3af', width: '40px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' } as CSSProperties}>
          {name}
        </span>
        <select
          value={String(value)}
          onChange={(e) => handleChange(e.target.value === 'true')}
          style={{
            flex: 1, fontSize: '10px', padding: '1px 2px', border: '1px solid #e5e7eb', borderRadius: '3px',
            background: 'white', fontFamily: 'monospace', color: '#374151',
          } as CSSProperties}
        >
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      </div>
    )
  }

  if (inputType === 'color' || (typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value))) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' } as CSSProperties}>
        <span style={{ fontSize: '9px', color: '#9ca3af', width: '40px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' } as CSSProperties}>
          {name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 } as CSSProperties}>
          <input type="color" value={value}
            onChange={(e) => handleChange(e.target.value)}
            style={{ width: '18px', height: '18px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '3px' } as CSSProperties}
          />
          <input type="text" value={value}
            onChange={(e) => handleChange(e.target.value)}
            style={{ flex: 1, fontSize: '10px', padding: '1px 2px', border: '1px solid #e5e7eb', borderRadius: '3px', fontFamily: 'monospace', color: '#374151', minWidth: 0, width: 'auto' } as CSSProperties}
          />
        </div>
      </div>
    )
  }

  if (options && options.length > 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' } as CSSProperties}>
        <span style={{ fontSize: '9px', color: '#9ca3af', width: '40px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' } as CSSProperties}>
          {name}
        </span>
        <select
          value={String(value)}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            flex: 1, fontSize: '10px', padding: '1px 2px', border: '1px solid #e5e7eb', borderRadius: '3px',
            background: 'white', fontFamily: 'monospace', color: '#374151',
          } as CSSProperties}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  if (inputType === 'number') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' } as CSSProperties}>
        <span style={{ fontSize: '9px', color: '#9ca3af', width: '40px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' } as CSSProperties}>
          {name}
        </span>
        <input type="number" value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={meta?.placeholder}
          style={{ flex: 1, fontSize: '10px', padding: '1px 2px', border: '1px solid #e5e7eb', borderRadius: '3px', fontFamily: 'monospace', color: '#374151', width: 'auto', minWidth: 0 } as CSSProperties}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' } as CSSProperties}>
      <span style={{ fontSize: '9px', color: '#9ca3af', width: '40px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' } as CSSProperties}>
        {name}
      </span>
      <input type="text" value={String(value ?? '')}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={meta?.placeholder}
        style={{ flex: 1, fontSize: '10px', padding: '1px 2px', border: '1px solid #e5e7eb', borderRadius: '3px', fontFamily: 'monospace', color: '#374151', width: 'auto', minWidth: 0 } as CSSProperties}
      />
    </div>
  )
}
