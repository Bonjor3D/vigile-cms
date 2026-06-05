import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.ts'

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [formLogin, setFormLogin] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(formLogin, formPassword, rememberMe)
      navigate('/admin/manager')
    } catch {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-80">
        <h1 className="text-2xl font-bold mb-6 text-center">Vigile</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Login</label>
          <input
            type="text"
            value={formLogin}
            onChange={(e) => setFormLogin(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
            minLength={3}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
            minLength={6}
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          First time? Account will be created automatically.
        </p>
      </form>
    </div>
  )
}
