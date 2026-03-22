import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-app">
        <h1 className="font-heading text-[28px] text-text-primary text-center mb-2">
          The Household
        </h1>
        <p className="font-ui text-sm text-text-secondary text-center mb-10">
          Split expenses with your housemates
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary px-4 py-3 focus:border-border-strong focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary px-4 py-3 focus:border-border-strong focus:outline-none"
              required
            />
          </div>

          {error && (
            <p className="font-ui text-sm text-accent">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-btn text-surface font-ui font-medium text-[15px] tracking-[0.01em] rounded-pill py-4 mt-4 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="font-ui text-sm text-text-secondary text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-text-primary underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
