import { create } from 'zustand'
import type { User } from '../entities/User.ts'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (login: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (login, password, rememberMe) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password, rememberMe }),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    set({ user: data.user, token: data.token, isAuthenticated: true })
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user, token: data.token, isAuthenticated: true })
      } else {
        set({ user: null, token: null, isAuthenticated: false })
      }
    } catch {
      set({ user: null, token: null, isAuthenticated: false })
    }
  },
}))
