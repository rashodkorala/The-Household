import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHousehold } from '../hooks/useHousehold'

export default function HouseholdSetup() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { createHousehold, joinHousehold } = useHousehold()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'create') {
        await createHousehold(name, displayName)
      } else {
        await joinHousehold(inviteCode, displayName)
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-bg flex items-center justify-center px-5 sm:px-6">
      <div className="w-full max-w-app">
        <div className="bg-surface border border-border rounded-md p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="w-9 h-1 bg-border-strong rounded-full mx-auto mb-5" />
          <h2 className="font-heading text-[20px] text-text-primary text-center mb-6">
            {mode === 'create' ? 'Create new group' : 'Join a group'}
          </h2>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 font-ui text-sm py-2 rounded-pill border ${
                mode === 'create'
                  ? 'bg-btn text-surface border-btn'
                  : 'bg-transparent text-text-secondary border-border'
              }`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 font-ui text-sm py-2 rounded-pill border ${
                mode === 'join'
                  ? 'bg-btn text-surface border-btn'
                  : 'bg-transparent text-text-secondary border-border'
              }`}
            >
              Join
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Maria"
                className="w-full bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary px-4 py-3 focus:border-border-strong focus:outline-none placeholder:text-text-muted"
                required
              />
            </div>

            {mode === 'create' ? (
              <div>
                <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
                  Household Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer trip"
                  className="w-full bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary px-4 py-3 focus:border-border-strong focus:outline-none placeholder:text-text-muted"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A3B2C1"
                  maxLength={6}
                  className="w-full bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary px-4 py-3 focus:border-border-strong focus:outline-none placeholder:text-text-muted uppercase tracking-widest"
                  required
                />
              </div>
            )}

            {error && (
              <p className="font-ui text-sm text-accent">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-btn text-surface font-ui font-medium text-[15px] tracking-[0.01em] rounded-pill py-4 mt-2 disabled:opacity-50"
            >
              {loading
                ? (mode === 'create' ? 'Creating...' : 'Joining...')
                : (mode === 'create' ? 'Create group' : 'Join group')
              }
            </button>
          </form>

          <p className="font-ui text-[13px] text-text-muted text-center mt-4">
            {mode === 'create'
              ? 'All participants will receive an invite'
              : 'Ask a housemate for their invite code'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
