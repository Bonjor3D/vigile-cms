import { useEffect, useMemo } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.ts'
import { useSettingsStore } from '../stores/settings.ts'
import { LoginPage } from '../pages/LoginPage.tsx'
import { SitePage } from '../pages/SitePage.tsx'
import { EditorPage } from '../pages/EditorPage.tsx'
import { PublicPage } from '../pages/PublicPage.tsx'
import { TestEditor } from '../pages/TestEditor.tsx'
import { TestViewer } from '../pages/TestViewer.tsx'
import { TestResults } from '../pages/TestResults.tsx'

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentTheme, themeVars } = useSettingsStore()

  const cssVars = useMemo(() => {
    const current = currentTheme
    return themeVars.map((v) => `  --${v.name}: ${current === 'light' ? v.light : v.dark};`).join('\n')
  }, [currentTheme, themeVars])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme)

    let styleEl = document.getElementById('theme-vars-css')
    const head = document.head
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'theme-vars-css'
      head.appendChild(styleEl)
    }
    styleEl.textContent = `:root {\n${cssVars || '  /* no custom vars */'}\n}`
  }, [currentTheme, cssVars])

  return <>{children}</>
}

export function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const { fetchSettings } = useSettingsStore()

  useEffect(() => {
    checkAuth()
    fetchSettings()
  }, [checkAuth, fetchSettings])

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/test/:id" element={<TestViewer />} />

        <Route path="/" element={<PublicPage />} />
        <Route path="/*" element={<PublicPage />} />

        {!isAuthenticated ? (
          <>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/manager" element={<Navigate to="/admin/login" />} />
            <Route path="/editor/:slug" element={<Navigate to="/admin/login" />} />
            <Route path="/editor/test/:id" element={<Navigate to="/admin/login" />} />
            <Route path="/test/:id/results" element={<Navigate to="/admin/login" />} />
          </>
        ) : (
          <>
            <Route path="/admin/login" element={<Navigate to="/admin/manager" />} />
            <Route path="/admin/manager" element={<SitePage />} />
            <Route path="/editor/:slug" element={<EditorPage />} />
            <Route path="/editor/test/:id" element={<TestEditor />} />
            <Route path="/test/:id/results" element={<TestResults />} />
          </>
        )}
      </Routes>
    </ThemeProvider>
  )
}
