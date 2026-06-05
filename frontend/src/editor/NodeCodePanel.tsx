import { useState } from 'react'
import type { CompiledCode } from './nodes/nodeDefinitions.ts'

interface NodeCodePanelProps {
  compiled: CompiledCode
}

export function NodeCodePanel({ compiled }: NodeCodePanelProps) {
  const [tab, setTab] = useState<'css' | 'js'>('css')
  const [copied, setCopied] = useState(false)

  const code = tab === 'css' ? compiled.css : compiled.js
  const language = tab === 'css' ? 'css' : 'javascript'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setTab('css')}
            className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${tab === 'css' ? 'bg-white text-indigo-600 shadow-sm font-medium' : 'text-gray-500'}`}
            type="button"
          >CSS</button>
          <button
            onClick={() => setTab('js')}
            className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${tab === 'js' ? 'bg-white text-indigo-600 shadow-sm font-medium' : 'text-gray-500'}`}
            type="button"
          >JS</button>
        </div>
        <button
          onClick={handleCopy}
          className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          type="button"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <pre className="text-[11px] font-mono leading-relaxed text-gray-800 whitespace-pre-wrap">{code || <span className="text-gray-300 italic">No code generated. Add nodes to the workspace.</span>}</pre>
      </div>
    </div>
  )
}
