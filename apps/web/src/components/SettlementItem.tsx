import { useHouseholdStore } from '../store/householdStore'
import MemberAvatar from './MemberAvatar'

const formatCAD = (cents: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)

interface SettlementItemProps {
  from: number
  to: number
  amount: number
  status: 'outstanding' | 'pending' | 'confirmed'
  currentMemberId?: number
  confirmedByFrom?: boolean
  confirmedByTo?: boolean
  onSettle?: () => void
  onConfirm?: () => void
  loading?: boolean
}

export default function SettlementItem({
  from,
  to,
  amount,
  status,
  currentMemberId,
  confirmedByFrom,
  confirmedByTo,
  onSettle,
  onConfirm,
  loading,
}: SettlementItemProps) {
  const members = useHouseholdStore((s) => s.members)
  const fromMember = members.find((m) => m.id === from)
  const toMember = members.find((m) => m.id === to)

  // For pending: determine if current user needs to confirm
  const isFrom = currentMemberId === from
  const isTo = currentMemberId === to
  const myConfirmation = isFrom ? confirmedByFrom : isTo ? confirmedByTo : false
  const needsMyConfirmation = status === 'pending' && (isFrom || isTo) && !myConfirmation

  return (
    <div className={`py-4 ${status === 'confirmed' ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <MemberAvatar
          name={fromMember?.display_name || '?'}
          color={fromMember?.avatar_color}
          size={40}
        />
        <svg className="w-5 h-5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <MemberAvatar
          name={toMember?.display_name || '?'}
          color={toMember?.avatar_color}
          size={40}
        />
        <div className="flex-1 min-w-0 ml-1">
          <p className="font-body text-[15px] text-text-primary">
            {fromMember?.display_name} pays {toMember?.display_name}
          </p>
          <p className="font-display text-[28px] font-light text-text-primary leading-none mt-1">
            {formatCAD(amount)}
          </p>
        </div>
      </div>

      {/* Status / Actions row */}
      {status === 'outstanding' && onSettle && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onSettle}
            disabled={loading}
            className="font-ui text-[13px] text-surface bg-btn rounded-pill px-5 py-2 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Mark as paid'}
          </button>
        </div>
      )}

      {status === 'pending' && (
        <div className="mt-3 space-y-2">
          {/* Confirmation badges */}
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 font-ui text-[12px] ${confirmedByFrom ? 'text-positive' : 'text-text-muted'}`}>
              {confirmedByFrom ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {fromMember?.display_name}: {confirmedByFrom ? 'Paid' : 'Pending'}
            </span>
            <span className={`inline-flex items-center gap-1.5 font-ui text-[12px] ${confirmedByTo ? 'text-positive' : 'text-text-muted'}`}>
              {confirmedByTo ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toMember?.display_name}: {confirmedByTo ? 'Got paid' : 'Pending'}
            </span>
          </div>

          {/* Confirm button if current user hasn't confirmed yet */}
          {needsMyConfirmation && onConfirm && (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full font-ui text-[13px] font-medium text-surface bg-btn rounded-pill py-3 disabled:opacity-50"
            >
              {loading
                ? 'Confirming...'
                : isFrom
                  ? 'Confirm I paid'
                  : 'Confirm I got paid'}
            </button>
          )}

          {/* Already confirmed message */}
          {status === 'pending' && (isFrom || isTo) && myConfirmation && (
            <p className="font-ui text-[12px] text-text-muted text-center">
              Waiting for {isFrom ? toMember?.display_name : fromMember?.display_name} to confirm
            </p>
          )}
        </div>
      )}

      {status === 'confirmed' && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 font-ui text-[12px] text-positive">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Settled
          </span>
        </div>
      )}
    </div>
  )
}
