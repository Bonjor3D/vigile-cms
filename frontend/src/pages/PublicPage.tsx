import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { usePageStore } from '../stores/page.ts'
import { useSettingsStore } from '../stores/settings.ts'
import { useAuthStore } from '../stores/auth.ts'
import type { Page } from '../types/component.ts'
import { Renderer, ResponsiveStyles } from '../renderer/Renderer.tsx'
import { createDefaultPage } from '../utils/element-factory.ts'

export function PublicPage() {
  const { '*': splat } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { fetchPageByEndpoint } = usePageStore()
  const { fetchSettings, header, footer } = useSettingsStore()
  const { isAuthenticated } = useAuthStore()
  const [page, setPage] = useState<Page | null>(null)
  const [notFound, setNotFound] = useState(false)

  const endpoint = (splat || location.pathname.slice(1) || 'index').replace(/\/$/, '')

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    setNotFound(false)
    setPage(null)

    fetchPageByEndpoint(endpoint || 'index').then((p) => {
      if (p) {
        setPage(p)
      } else {
        setNotFound(true)
      }
    })
  }, [endpoint, fetchPageByEndpoint])

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-300 mb-2">404</h1>
          <p className="text-gray-500 mb-4">Page not found</p>
          {isAuthenticated ? (
            <button onClick={() => navigate('/admin/manager')} className="text-sm text-indigo-500 hover:underline">
              Go to Manager
            </button>
          ) : (
            <button onClick={() => navigate('/admin/login')} className="text-sm text-indigo-500 hover:underline">
              Login
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!page) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>
  }

  return (
    <div className="min-h-screen">
      {header && <><ResponsiveStyles node={header} /><Renderer node={header} /></>}
      <div>
        <ResponsiveStyles node={page.root} />
        <Renderer node={page.root} />
      </div>
      {footer && <><ResponsiveStyles node={footer} /><Renderer node={footer} /></>}
    </div>
  )
}
