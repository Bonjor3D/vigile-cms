import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { usePageStore } from '../stores/page.ts'
import { useAuthStore } from '../stores/auth.ts'
import { useSettingsStore } from '../stores/settings.ts'
import { useTestStore } from '../stores/tests.ts'
import type { Page } from '../types/component.ts'
import { createDefaultPage } from '../utils/element-factory.ts'

export function SitePage() {
  const navigate = useNavigate()
  const { pages, fetchPages, createPage, deletePage } = usePageStore()
  const { fetchSettings, elements, createElement: storeCreateElement, deleteElement: storeDeleteElement } = useSettingsStore()
  const { tests, fetchTests, createTest, deleteTest } = useTestStore()
  const { logout } = useAuthStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newEndpoint, setNewEndpoint] = useState('')
  const [showTestCreate, setShowTestCreate] = useState(false)
  const [newTestTitle, setNewTestTitle] = useState('')
  const [showElementCreate, setShowElementCreate] = useState(false)
  const [newElementName, setNewElementName] = useState('')

  useEffect(() => {
    fetchPages()
    fetchSettings()
    fetchTests()
  }, [fetchPages, fetchSettings, fetchTests])

  const handleCreate = async () => {
    if (!newTitle || !newSlug) return
    const page = createDefaultPage(newTitle, newSlug, newEndpoint || newSlug)
    await createPage(page)
    setShowCreate(false)
    setNewTitle('')
    setNewSlug('')
    setNewEndpoint('')
  }

  const handleCreateTest = async () => {
    if (!newTestTitle) return
    await createTest(newTestTitle)
    setShowTestCreate(false)
    setNewTestTitle('')
  }

  const handleCreateElement = () => {
    if (!newElementName) return
    const el = storeCreateElement(newElementName)
    setShowElementCreate(false)
    setNewElementName('')
    navigate(`/editor/element-${el.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Site Structure</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { logout(); navigate('/admin/login') }}
              className="text-xs px-3 py-1 border rounded hover:bg-gray-100"
            >
              Logout
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 text-sm"
            >
              + New Page
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">Create Page</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Page title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Slug (e.g., about)"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Endpoint (e.g., index, page, blog/post)"
                value={newEndpoint}
                onChange={(e) => setNewEndpoint(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-400">Leave empty to use slug as endpoint. Endpoint determines the public URL path.</p>
              <div className="flex gap-2">
                <button onClick={handleCreate} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                  Create
                </button>
                <button onClick={() => setShowCreate(false)} className="text-gray-500 px-4 py-2">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md">
          {/* Global Header */}
          <div className="border-b border-indigo-100 bg-indigo-50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium">Header</span>
                <span className="text-sm text-gray-400">(global — shared across pages)</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/editor/header')} className="text-sm text-indigo-500 hover:underline">Edit</button>
              </div>
            </div>
          </div>

          {/* Global Footer */}
          <div className="border-b border-indigo-100 bg-indigo-50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium">Footer</span>
                <span className="text-sm text-gray-400">(global — shared across pages)</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/editor/footer')} className="text-sm text-indigo-500 hover:underline">Edit</button>
              </div>
            </div>
          </div>

          {/* Regular pages */}
          {pages.length === 0 && (
            <p className="p-8 text-gray-500 text-center">No pages yet. Create your first page!</p>
          )}
          {pages.map((page) => (
            <PageItem
              key={page.id}
              page={page}
              allPages={pages}
              onEdit={() => navigate(`/editor/${page.slug}`)}
              onView={() => navigate(`/${page.endpoint || page.slug}`)}
              onDelete={() => deletePage(page.id)}
            />
          ))}
        </div>

        {/* Elements Section */}
        <div className="bg-white rounded-lg shadow-md mt-8">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold">Elements</h2>
            <button
              onClick={() => setShowElementCreate(true)}
              className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 text-sm"
            >
              + New Element
            </button>
          </div>

          {showElementCreate && (
            <div className="p-4 border-b">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Element name"
                  value={newElementName}
                  onChange={(e) => setNewElementName(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                  autoFocus
                />
                <button onClick={handleCreateElement} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                  Create
                </button>
                <button onClick={() => { setShowElementCreate(false); setNewElementName('') }} className="text-gray-500 px-4 py-2">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {elements.length === 0 && (
            <p className="p-8 text-gray-500 text-center">No elements yet.</p>
          )}
          {elements.map((el) => (
            <div key={el.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium">{el.children?.[0]?.text || el.id.slice(0, 8)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/editor/element-${el.id}`)} className="text-sm text-indigo-500 hover:underline">Edit</button>
                <button onClick={() => storeDeleteElement(el.id)} className="text-sm text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Tests Section */}
        <div className="bg-white rounded-lg shadow-md mt-8">
          <div className="border-b border-indigo-100 bg-indigo-50 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tests</h2>
            <button
              onClick={() => setShowTestCreate(true)}
              className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 text-sm"
            >
              + New Test
            </button>
          </div>

          {showTestCreate && (
            <div className="p-4 border-b">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Test title"
                  value={newTestTitle}
                  onChange={(e) => setNewTestTitle(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button onClick={handleCreateTest} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                  Create
                </button>
                <button onClick={() => setShowTestCreate(false)} className="text-gray-500 px-4 py-2">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {tests.length === 0 && (
            <p className="p-8 text-gray-500 text-center">No tests yet. Create your first test!</p>
          )}
          {tests.map((test) => (
            <div key={test.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-medium">{test.title}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/test/${test.id}/results`)} className="text-sm text-indigo-500 hover:underline">View</button>
                <button onClick={() => navigate(`/editor/test/${test.id}`)} className="text-sm text-indigo-500 hover:underline">Edit</button>
                <button onClick={() => deleteTest(test.id)} className="text-sm text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PageItem({
  page,
  allPages,
  onEdit,
  onView,
  onDelete,
}: {
  page: Page
  allPages: Page[]
  onEdit: () => void
  onView: () => void
  onDelete: () => void
}) {
  const children = allPages.filter((p) => p.parentId === page.id).sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="border-b last:border-b-0">
      <div className="flex items-center justify-between p-4 hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${page.visibility === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="font-medium">{page.title}</span>
          <span className="text-sm text-gray-400">/{page.endpoint || page.slug}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onView} className="text-sm text-indigo-500 hover:underline">View</button>
          <button onClick={onEdit} className="text-sm text-indigo-500 hover:underline">Edit</button>
          <button onClick={onDelete} className="text-sm text-red-500 hover:underline">Delete</button>
        </div>
      </div>
      {children.length > 0 && (
        <div className="ml-6 border-l">
          {children.map((child) => (
            <PageItem key={child.id} page={child} allPages={allPages} onEdit={onEdit} onView={onView} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
