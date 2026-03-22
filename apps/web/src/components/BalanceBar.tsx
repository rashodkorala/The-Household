import { useHouseholdStore } from '../store/householdStore'
import MemberAvatar from './MemberAvatar'

const formatCAD = (cents: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)

interface BalanceBarProps {
  balances: Record<number, number>
  currentMemberId: number
}

export default function BalanceBar({ balances, currentMemberId }: BalanceBarProps) {
  const members = useHouseholdStore((s) => s.members)

  const myBalance = balances[currentMemberId] || 0

  const youOwe = myBalance < 0 ? Math.abs(myBalance) : 0
  const youAreOwed = myBalance > 0 ? myBalance : 0

  const debtors = members.filter((m) => m.id !== currentMemberId && (balances[m.id] || 0) < 0)
  const creditors = members.filter((m) => m.id !== currentMemberId && (balances[m.id] || 0) > 0)

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* You Owe Card */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between min-h-[140px]">
        <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          You owe
        </p>
        <div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-display text-[48px] font-light leading-none text-text-primary">
              {Math.floor(youOwe / 100)}
            </span>
            <span className="font-ui text-[14px] text-text-secondary">
              .{String(youOwe % 100).padStart(2, '0')} CAD
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex -space-x-2">
              {creditors.slice(0, 3).map((m) => (
                <MemberAvatar key={m.id} name={m.display_name} color={m.avatar_color} size={28} />
              ))}
            </div>
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </div>
        </div>
      </div>

      {/* You Are Owed Card */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between min-h-[140px]">
        <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          You are owed
        </p>
        <div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-display text-[48px] font-light leading-none text-text-primary">
              {Math.floor(youAreOwed / 100)}
            </span>
            <span className="font-ui text-[14px] text-text-secondary">
              .{String(youAreOwed % 100).padStart(2, '0')} CAD
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex -space-x-2">
              {debtors.slice(0, 3).map((m) => (
                <MemberAvatar key={m.id} name={m.display_name} color={m.avatar_color} size={28} />
              ))}
            </div>
            <svg className="w-5 h-5 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
