import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useHouseholdStore } from '../store/householdStore'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const { household, members } = useHouseholdStore()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const currentMember = members.find((m) => m.user_id === user?.id)

  const [householdName, setHouseholdName] = useState(household?.name || '')
  const [displayName, setDisplayName] = useState(currentMember?.display_name || '')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleCopyCode = async () => {
    if (!household) return
    await navigator.clipboard.writeText(household.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveHouseholdName = async () => {
    if (!household) return
    setSaving(true)
    const { error } = await supabase
      .from('households')
      .update({ name: householdName })
      .eq('id', household.id)
    setSaving(false)
    setMessage(error ? error.message : 'Saved!')
    setTimeout(() => setMessage(''), 2000)
  }

  const handleSaveDisplayName = async () => {
    if (!currentMember) return
    setSaving(true)
    const { error } = await supabase
      .from('members')
      .update({ display_name: displayName })
      .eq('id', currentMember.id)
    setSaving(false)
    setMessage(error ? error.message : 'Saved!')
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-[28px] text-text-primary">Settings</h1>

      {message && (
        <p className="font-ui text-sm text-positive">{message}</p>
      )}

      {/* Household Name */}
      <div className="space-y-2">
        <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block">
          Household Name
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            className="flex-1 bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary px-4 py-3 focus:border-border-strong focus:outline-none"
          />
          <button
            onClick={handleSaveHouseholdName}
            disabled={saving}
            className="bg-btn text-surface font-ui font-medium text-[13px] rounded-pill px-5 py-3 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Invite Code */}
      <div className="border-b border-border pb-6">
        <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
          Invite Code
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-ui text-[18px] sm:text-[20px] tracking-[0.2em] text-text-primary font-medium">
            {household?.invite_code}
          </span>
          <button
            onClick={handleCopyCode}
            className="touch-active font-ui text-[13px] text-text-secondary border border-border rounded-pill px-4 py-2.5 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block">
          Your Display Name
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="flex-1 bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary px-4 py-3 focus:border-border-strong focus:outline-none"
          />
          <button
            onClick={handleSaveDisplayName}
            disabled={saving}
            className="bg-btn text-surface font-ui font-medium text-[13px] rounded-pill px-5 py-3 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="border-t border-border pt-6">
        <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-3">
          Members
        </label>
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-ui text-white text-sm font-medium"
                style={{ backgroundColor: m.avatar_color }}
              >
                {m.display_name[0]?.toUpperCase()}
              </div>
              <span className="font-ui text-[15px] text-text-primary">{m.display_name}</span>
              {m.user_id === user?.id && (
                <span className="font-ui text-[11px] text-text-muted">(you)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="border-t border-border pt-6">
        <button
          onClick={handleSignOut}
          className="font-ui text-[15px] text-accent"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
