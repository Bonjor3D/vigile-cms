import { useRef, useEffect } from 'react'

interface CodeEditorPanelProps {
  value: string
  onChange: (value: string) => void
  language: string
  height: string
}

export function CodeEditorPanel({ value, onChange, language, height }: CodeEditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!editorRef.current) return

    let cancelled = false

    import('monaco-editor').then((monaco) => {
      if (cancelled || !editorRef.current) return

      const editor = monaco.editor.create(editorRef.current, {
        value,
        language,
        theme: 'vs',
        minimap: { enabled: false },
        fontSize: 12,
        lineNumbers: 'off',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        tabSize: 2,
        padding: { top: 8, bottom: 8 },
      })

      editor.onDidChangeModelContent(() => {
        onChange(editor.getValue())
      })

      editorInstanceRef.current = editor
    })

    return () => {
      cancelled = true
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose()
        editorInstanceRef.current = null
      }
    }
  }, [language])

  useEffect(() => {
    if (editorInstanceRef.current && editorInstanceRef.current.getValue() !== value) {
      editorInstanceRef.current.setValue(value)
    }
  }, [value])

  return <div ref={editorRef} className="border border-gray-200 rounded overflow-hidden" style={{ height }} />
}
