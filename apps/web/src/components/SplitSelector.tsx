import { useState, useEffect } from 'react'
import { useHouseholdStore, type Member } from '../store/householdStore'
import MemberAvatar from './MemberAvatar'

type SplitType = 'equal_all' | 'equal_selected' | 'custom'

interface SplitSelectorProps {
  totalCents: number
  onSplitsChange: (splits: { member_id: number; amount: number }[], type: SplitType) => void
}

export default function SplitSelector({ totalCents, onSplitsChange }: SplitSelectorProps) {
  const members = useHouseholdStore((s) => s.members)
  const [splitType, setSplitType] = useState<SplitType>('equal_all')
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(
    new Set(members.map((m) => m.id))
  )
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    setSelectedMembers(new Set(members.map((m) => m.id)))
  }, [members])

  useEffect(() => {
    let splits: { member_id: number; amount: number }[] = []

    if (splitType === 'equal_all') {
      const perPerson = Math.floor(totalCents / members.length)
      const remainder = totalCents - perPerson * members.length
      splits = members.map((m, i) => ({
        member_id: m.id,
        amount: perPerson + (i < remainder ? 1 : 0),
      }))
    } else if (splitType === 'equal_selected') {
      const selected = members.filter((m) => selectedMembers.has(m.id))
      if (selected.length === 0) return
      const perPerson = Math.floor(totalCents / selected.length)
      const remainder = totalCents - perPerson * selected.length
      splits = selected.map((m, i) => ({
        member_id: m.id,
        amount: perPerson + (i < remainder ? 1 : 0),
      }))
    } else {
      splits = members
        .filter((m) => customAmounts[m.id])
        .map((m) => ({
          member_id: m.id,
          amount: Math.round(parseFloat(customAmounts[m.id] || '0') * 100),
        }))
    }

    onSplitsChange(splits, splitType)
  }, [splitType, totalCents, selectedMembers, customAmounts, members, onSplitsChange])

  const toggleMember = (id: number) => {
    const next = new Set(selectedMembers)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedMembers(next)
  }

  const customTotal = Object.values(customAmounts).reduce(
    (sum, v) => sum + Math.round(parseFloat(v || '0') * 100),
    0
  )

  // Compute current splits for preview
  const currentSplits = (() => {
    if (splitType === 'equal_all') {
      if (members.length === 0) return []
      const perPerson = Math.floor(totalCents / members.length)
      const remainder = totalCents - perPerson * members.length
      return members.map((m, i) => ({
        member: m,
        amount: perPerson + (i < remainder ? 1 : 0),
      }))
    } else if (splitType === 'equal_selected') {
      const selected = members.filter((m) => selectedMembers.has(m.id))
      if (selected.length === 0) return []
      const perPerson = Math.floor(totalCents / selected.length)
      const remainder = totalCents - perPerson * selected.length
      return selected.map((m, i) => ({
        member: m,
        amount: perPerson + (i < remainder ? 1 : 0),
      }))
    } else {
      return members
        .filter((m) => customAmounts[m.id])
        .map((m) => ({
          member: m,
          amount: Math.round(parseFloat(customAmounts[m.id] || '0') * 100),
        }))
    }
  })()

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['equal_all', 'equal_selected', 'custom'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSplitType(type)}
            className={`flex-1 font-ui text-[13px] py-2 rounded-pill border transition-colors ${
              splitType === type
                ? 'bg-btn text-surface border-btn'
                : 'bg-transparent text-text-secondary border-border hover:border-border-strong'
            }`}
          >
            {type === 'equal_all' ? 'Equal' : type === 'equal_selected' ? 'Selected' : 'Custom'}
          </button>
        ))}
      </div>

      {splitType === 'equal_selected' && (
        <div className="space-y-2">
          {members.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-3 py-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedMembers.has(m.id)}
                onChange={() => toggleMember(m.id)}
                className="w-4 h-4 rounded accent-btn"
              />
              <MemberAvatar name={m.display_name} color={m.avatar_color} size={32} />
              <span className="font-ui text-[15px] text-text-primary flex-1">{m.display_name}</span>
              {selectedMembers.has(m.id) && totalCents > 0 && (
                <span className="font-ui text-[13px] text-text-secondary">
                  ${(currentSplits.find((s) => s.member.id === m.id)?.amount || 0) / 100}
                </span>
              )}
            </label>
          ))}
        </div>
      )}

      {splitType === 'custom' && (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <MemberAvatar name={m.display_name} color={m.avatar_color} size={32} />
              <span className="font-ui text-[15px] text-text-primary flex-1">{m.display_name}</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ui text-text-muted text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customAmounts[m.id] || ''}
                  onChange={(e) =>
                    setCustomAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))
                  }
                  className="w-24 bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary pl-7 pr-3 py-2 focus:border-border-strong focus:outline-none"
                />
              </div>
            </div>
          ))}
          {totalCents > 0 && customTotal !== totalCents && (
            <p className="font-ui text-[13px] text-accent">
              Splits total ${(customTotal / 100).toFixed(2)} — must equal ${(totalCents / 100).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Split preview — shows for all modes when amount is entered */}
      {totalCents > 0 && currentSplits.length > 0 && splitType !== 'custom' && (
        <div className="bg-surface-alt rounded-sm p-4 space-y-2">
          <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-2">
            Each person owes
          </p>
          {currentSplits.map((s) => (
            <div key={s.member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MemberAvatar name={s.member.display_name} color={s.member.avatar_color} size={28} />
                <span className="font-ui text-[14px] text-text-primary">{s.member.display_name}</span>
              </div>
              <span className="font-ui text-[14px] font-medium text-text-primary">
                ${(s.amount / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
