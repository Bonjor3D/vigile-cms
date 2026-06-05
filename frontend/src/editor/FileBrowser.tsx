import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../stores/auth.ts'

interface FileEntry {
  name: string
  path: string
  type: 'folder' | 'image' | 'video' | 'audio' | 'code' | 'file'
  size?: number
  modifiedAt?: string
}

interface DirResponse {
  currentPath: string
  parentPath: string | null
  entries: FileEntry[]
}

interface FileBrowserProps {
  onSelect?: (url: string) => void
  onClose: () => void
  selectMode?: boolean
}

async function apiFiles(path: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const isFormData = options.body instanceof FormData
  if (!isFormData) headers['Content-Type'] = 'application/json'
  const res = await fetch(path, { ...options, headers, credentials: 'include' })
  return res
}

const FILE_ICONS: Record<string, string> = {
  folder: '📁',
  image: '🖼',
  video: '🎬',
  audio: '🎵',
  code: '📄',
  file: '📄',
}

function formatSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

export function FileBrowser({ onSelect, onClose, selectMode }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState('')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [parentPath, setParentPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [clipboard, setClipboard] = useState<{ action: 'copy' | 'cut'; path: string } | null>(null)
  const [creating, setCreating] = useState<'folder' | 'file' | null>(null)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [addressPath, setAddressPath] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const newNameRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  const listDir = useCallback(async (path: string) => {
    setLoading(true)
    try {
      const q = path ? `?path=${encodeURIComponent(path)}` : ''
      const res = await apiFiles(`/api/files${q}`)
      if (res.ok) {
        const data: DirResponse = await res.json()
        setEntries(data.entries)
        setParentPath(data.parentPath)
        setCurrentPath(data.currentPath)
        setAddressPath(data.currentPath || '/')
      }
    } catch { showToast('Failed to list directory') }
    setLoading(false)
  }, [])

  useEffect(() => { listDir('') }, [listDir])

  useEffect(() => { if (creating) newNameRef.current?.focus() }, [creating])

  const navigate = (path: string) => { setSelected(null); setPreviewUrl(null); listDir(path) }
  const goUp = () => { if (parentPath !== null) navigate(parentPath) }

  const createFolder = async () => {
    if (!newName.trim()) return
    const q = `?path=${encodeURIComponent(currentPath)}&name=${encodeURIComponent(newName.trim())}`
    const res = await apiFiles(`/api/files/folder${q}`, { method: 'POST' })
    if (res.ok) { showToast('Folder created'); setCreating(null); setNewName(''); listDir(currentPath) }
    else { const e = await res.json(); showToast(e.error || 'Failed') }
  }

  const createFile = async () => {
    if (!newName.trim()) return
    const q = `?path=${encodeURIComponent(currentPath)}&name=${encodeURIComponent(newName.trim())}`
    const res = await apiFiles(`/api/files/file${q}`, { method: 'POST', body: JSON.stringify({ content: '' }) })
    if (res.ok) { showToast('File created'); setCreating(null); setNewName(''); listDir(currentPath) }
    else { const e = await res.json(); showToast(e.error || 'Failed') }
  }

  const deleteEntry = async (entry: FileEntry) => {
    if (!confirm(`Delete "${entry.name}"?`)) return
    const q = `?path=${encodeURIComponent(entry.path)}`
    const res = await apiFiles(`/api/files${q}`, { method: 'DELETE' })
    if (res.ok) { showToast(`${entry.type === 'folder' ? 'Folder' : 'File'} deleted`); listDir(currentPath) }
    else showToast('Delete failed')
  }

  const copyEntry = async (from: string, to: string) => {
    const res = await apiFiles('/api/files/copy', { method: 'POST', body: JSON.stringify({ from, to }) })
    if (res.ok) { showToast('Copied'); listDir(currentPath) }
    else showToast('Copy failed')
  }

  const moveEntry = async (from: string, to: string) => {
    const res = await apiFiles('/api/files/move', { method: 'POST', body: JSON.stringify({ from, to }) })
    if (res.ok) { showToast('Moved'); listDir(currentPath) }
    else showToast('Move failed')
  }

  const handlePaste = async () => {
    if (!clipboard) return
    const destPath = currentPath ? `${currentPath}/${selectedEntry()?.name ?? ''}` : selectedEntry()?.name ?? ''
    const targetPath = clipboard.action === 'copy'
      ? await getUniquePath(clipboard.path, currentPath)
      : `${currentPath}/${clipboard.path.split('/').pop()}`
    if (clipboard.action === 'copy') await copyEntry(clipboard.path, targetPath)
    else await moveEntry(clipboard.path, targetPath)
    setClipboard(null)
  }

  const selectedEntry = () => entries.find(e => e.path === selected)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    const q = currentPath ? `?path=${encodeURIComponent(currentPath)}` : ''
    const res = await apiFiles(`/api/files/upload${q}`, { method: 'POST', body: form })
    if (res.ok) { showToast('File uploaded'); listDir(currentPath) }
    else showToast('Upload failed')
    e.target.value = ''
  }

  const handleDoubleClick = (entry: FileEntry) => {
    if (entry.type === 'folder') navigate(entry.path)
    else if (selectMode && (entry.type === 'image' || entry.type === 'video')) {
      onSelect?.(`/storage/${entry.path}`)
      onClose()
    }
  }

  const handleContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault()
    setSelected(entry.path)
    setContextMenu({ x: e.clientX, y: e.clientY, entry })
  }

  const getUniquePath = async (sourcePath: string, destDir: string): Promise<string> => {
    const name = sourcePath.split('/').pop() || 'copy'
    const baseName = name.replace(/(\.[^.]+)$/, '')
    const ext = name.replace(baseName, '')
    let newPath = destDir ? `${destDir}/${name}` : name
    return newPath
  }

  const handleRename = async () => {
    if (!renaming || !renameValue.trim()) { setRenaming(null); return }
    const oldEntry = entries.find(e => e.path === renaming)
    if (!oldEntry) { setRenaming(null); return }
    const parentDir = renaming.includes('/') ? renaming.substring(0, renaming.lastIndexOf('/')) : ''
    const newPath = parentDir ? `${parentDir}/${renameValue.trim()}` : renameValue.trim()
    await moveEntry(renaming, newPath)
    setRenaming(null)
    setRenameValue('')
    listDir(currentPath)
  }

  const breadcrumbs = (currentPath || '').split('/').filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 w-[85vw] h-[80vh] max-w-5xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 shrink-0 rounded-t-xl">
          <h2 className="text-sm font-semibold text-gray-700">File Browser</h2>
          <div className="flex items-center gap-1">
            {selectMode && selected && selectedEntry()?.type === 'image' && (
              <button onClick={() => { onSelect?.(`/storage/${selected}`); onClose() }} className="px-3 py-1 text-xs font-medium bg-indigo-500 text-white rounded hover:bg-indigo-600" type="button">Select</button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600" type="button" title="Close">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-white shrink-0 flex-wrap gap-1">
          <div className="flex items-center gap-0.5">
            <ToolBtn onClick={() => navigate('')} title="Home">🏠</ToolBtn>
            <ToolBtn onClick={goUp} disabled={parentPath === null} title="Up">⬆</ToolBtn>
            <ToolBtn onClick={() => navigate(currentPath)} title="Refresh">🔄</ToolBtn>
            <span className="w-px h-4 bg-gray-200 mx-1" />
            <ToolBtn onClick={() => { setCreating('folder'); setNewName('') }} title="New Folder">📁+</ToolBtn>
            <ToolBtn onClick={() => { setCreating('file'); setNewName('') }} title="New File">📄+</ToolBtn>
            <ToolBtn onClick={() => fileInputRef.current?.click()} title="Upload File">⬆</ToolBtn>
            <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
            <span className="w-px h-4 bg-gray-200 mx-1" />
            <ToolBtn onClick={() => { if (selected) setClipboard({ action: 'copy', path: selected }) } } disabled={!selected} title="Copy">📋</ToolBtn>
            <ToolBtn onClick={() => { if (selected) setClipboard({ action: 'cut', path: selected }) } } disabled={!selected} title="Cut">✂</ToolBtn>
            <ToolBtn onClick={handlePaste} disabled={!clipboard} title="Paste">📌</ToolBtn>
            <ToolBtn onClick={() => { if (selected) deleteEntry(selectedEntry()!) } } disabled={!selected || selectedEntry()?.type === undefined} title="Delete">🗑</ToolBtn>
          </div>
        </div>

        {/* Address bar */}
        <div className="flex items-center gap-1 px-3 py-1 border-b border-gray-100 bg-white shrink-0">
          <span className="text-[10px] text-gray-400 mr-1">Path:</span>
          <span className="text-xs text-indigo-600 cursor-pointer hover:underline" onClick={() => navigate('')}>Storage</span>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-[10px] text-gray-300">/</span>
              <span className="text-xs text-indigo-600 cursor-pointer hover:underline" onClick={() => navigate(breadcrumbs.slice(0, i + 1).join('/'))}>{crumb}</span>
            </span>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Entries */}
          <div className={`overflow-auto ${previewUrl ? 'w-2/3' : 'flex-1'} border-r border-gray-100`}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Empty folder</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="text-left px-3 py-1.5 font-medium w-8"></th>
                    <th className="text-left px-2 py-1.5 font-medium">Name</th>
                    <th className="text-right px-3 py-1.5 font-medium w-20">Size</th>
                    <th className="text-right px-3 py-1.5 font-medium w-24">Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.path}
                      onClick={() => { setSelected(entry.path); if (entry.type === 'image') setPreviewUrl(`/storage/${entry.path}`); else setPreviewUrl(null) }}
                      onDoubleClick={() => handleDoubleClick(entry)}
                      onContextMenu={(e) => handleContextMenu(e, entry)}
                      className={`cursor-pointer border-b border-gray-50 hover:bg-indigo-50 transition-colors ${
                        selected === entry.path ? 'bg-indigo-100' : ''
                      }`}
                    >
                      <td className="px-3 py-1 text-center text-sm">{FILE_ICONS[entry.type] || '📄'}</td>
                      <td className="px-2 py-1">
                        {renaming === entry.path ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(null) }}
                            className="px-1 py-0.5 border border-indigo-400 rounded text-xs w-full focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="text-gray-700">{entry.name}</span>
                        )}
                      </td>
                      <td className="px-3 py-1 text-right text-gray-400">{formatSize(entry.size)}</td>
                      <td className="px-3 py-1 text-right text-gray-400">{formatDate(entry.modifiedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Inline create form */}
            {creating && (
              <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                <span className="text-sm">{creating === 'folder' ? '📁' : '📄'}</span>
                <input
                  ref={newNameRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={creating === 'folder' ? 'folder name' : 'file name.txt'}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-indigo-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') creating === 'folder' ? createFolder() : createFile()
                    if (e.key === 'Escape') { setCreating(null); setNewName('') }
                  }}
                />
                <button onClick={creating === 'folder' ? createFolder : createFile} className="px-2 py-1 bg-indigo-500 text-white rounded text-[10px] hover:bg-indigo-600" type="button">Create</button>
                <button onClick={() => { setCreating(null); setNewName('') }} className="px-2 py-1 border border-gray-200 rounded text-[10px] text-gray-500 hover:bg-gray-100" type="button">Cancel</button>
              </div>
            )}
          </div>

          {/* Preview pane */}
          {previewUrl && (
            <div className="w-1/3 flex items-center justify-center bg-gray-50 p-4 overflow-auto">
              {selected && selectedEntry()?.type === 'image' ? (
                <img src={previewUrl} alt="preview" className="max-w-full max-h-full rounded object-contain" />
              ) : selected && selectedEntry()?.type === 'video' ? (
                <video src={previewUrl} controls className="max-w-full max-h-full rounded" />
              ) : (
                <div className="text-xs text-gray-400 text-center">
                  <div className="text-3xl mb-2">{selectedEntry() ? FILE_ICONS[selectedEntry()!.type] : '📄'}</div>
                  <div className="font-medium text-gray-600">{selectedEntry()?.name}</div>
                  <div className="mt-1">{formatSize(selectedEntry()?.size)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed z-[60] w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 text-xs"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={() => setContextMenu(null)}
          >
            {contextMenu.entry.type === 'folder' && (
              <CtxBtn onClick={() => { navigate(contextMenu.entry.path); setContextMenu(null) }}>Open</CtxBtn>
            )}
            {contextMenu.entry.type !== 'folder' && (contextMenu.entry.type === 'image' || contextMenu.entry.type === 'video') && selectMode && (
              <CtxBtn onClick={() => { onSelect?.(`/storage/${contextMenu.entry.path}`); onClose() }}>Select</CtxBtn>
            )}
            <CtxBtn onClick={() => { setRenaming(contextMenu.entry.path); setRenameValue(contextMenu.entry.name); setContextMenu(null) }}>Rename</CtxBtn>
            <CtxBtn onClick={() => { setClipboard({ action: 'copy', path: contextMenu.entry.path }); setContextMenu(null) }}>Copy</CtxBtn>
            <CtxBtn onClick={() => { setClipboard({ action: 'cut', path: contextMenu.entry.path }); setContextMenu(null) }}>Cut</CtxBtn>
            <div className="border-t border-gray-100 my-1" />
            <CtxBtn onClick={() => { deleteEntry(contextMenu.entry); setContextMenu(null) }} className="text-red-500">Delete</CtxBtn>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-gray-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function ToolBtn({ onClick, disabled, title, children }: { onClick: () => void; disabled?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`px-1.5 py-1 rounded text-xs transition-colors ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600'}`} type="button"
    >
      {children}
    </button>
  )
}

function CtxBtn({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 transition-colors ${className || 'text-gray-700'}`} type="button"
    >
      {children}
    </button>
  )
}
