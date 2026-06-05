import { useAuthStore } from '../stores/auth.ts'

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const hasBody = options.body != null && !(options.body instanceof FormData)
  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && token) {
    const meRes = await fetch('/api/auth/me', { credentials: 'include' })
    if (meRes.ok) {
      const data = await meRes.json()
      useAuthStore.setState({ token: data.token, isAuthenticated: true })
      headers['Authorization'] = `Bearer ${data.token}`
      return fetch(path, { ...options, headers, credentials: 'include' })
    }
    useAuthStore.getState().logout()
  }

  return res
}
