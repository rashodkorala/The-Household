import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useHouseholdStore } from '../store/householdStore'
import { useExpenseStore } from '../store/expenseStore'
import { useExpenses } from '../hooks/useExpenses'
import { useSettlements, adjustBalancesForSettlements } from '../hooks/useSettlements'
import { computeBalances } from '../lib/balances'
import { computeSettlements } from '../lib/settlements'
import SettlementItem from '../components/SettlementItem'

export default function SettleUp() {
  const user = useAuthStore((s) => s.user)
  const members = useHouseholdStore((s) => s.members)
  const expenses = useExpenseStore((s) => s.expenses)
  const { fetchExpenses } = useExpenses()
  const { settlements, fetchSettlements, requestSettlement, confirmSettlement } = useSettlements()
  const [loading, setLoading] = useState(false)

  const currentMember = members.find((m) => m.user_id === user?.id)

  useEffect(() => {
    fetchExpenses()
    fetchSettlements()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Only fully confirmed settlements adjust balances
  const adjustedBalances = useMemo(() => {
    const raw = computeBalances(
      expenses.map((e) => ({
        amount: e.amount,
        paid_by: e.paid_by,
        splits: e.expense_splits.map((s) => ({
          member_id: s.member_id,
          amount: s.amount,
        })),
      }))
    )
    return adjustBalancesForSettlements(raw, settlements)
  }, [expenses, settlements])

  const transfers = useMemo(() => computeSettlements(adjustedBalances), [adjustedBalances])

  // Pending = at least one side not confirmed
  const pendingSettlements = settlements.filter(
    (s) => !s.confirmed_by_from || !s.confirmed_by_to
  )
  const confirmedSettlements = settlements.filter(
    (s) => s.confirmed_by_from && s.confirmed_by_to
  )

  const handleRequest = async (from: number, to: number, amount: number) => {
    setLoading(true)
    try {
      await requestSettlement(from, to, amount)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (settlementId: number) => {
    setLoading(true)
    try {
      await confirmSettlement(settlementId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-[28px] text-text-primary">Settle Up</h1>

      {/* Pending settlements awaiting confirmation */}
      {pendingSettlements.length > 0 && (
        <div>
          <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-3">
            Pending Confirmation
          </p>
          <div className="bg-surface border border-border rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.06)] divide-y divide-border px-5">
            {pendingSettlements.map((s) => (
              <SettlementItem
                key={s.id}
                from={s.from_member}
                to={s.to_member}
                amount={s.amount}
                status="pending"
                currentMemberId={currentMember?.id}
                confirmedByFrom={s.confirmed_by_from}
                confirmedByTo={s.confirmed_by_to}
                onConfirm={() => handleConfirm(s.id)}
                loading={loading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Outstanding balances that need settling */}
      {transfers.length > 0 ? (
        <div>
          <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-3">
            Outstanding
          </p>
          <div className="bg-surface border border-border rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.06)] divide-y divide-border px-5">
            {transfers.map((t, i) => (
              <SettlementItem
                key={i}
                from={t.from}
                to={t.to}
                amount={t.amount}
                status="outstanding"
                onSettle={() => handleRequest(t.from, t.to, t.amount)}
                loading={loading}
              />
            ))}
          </div>
        </div>
      ) : pendingSettlements.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-ui text-[15px] text-text-muted">All settled up!</p>
        </div>
      ) : null}

      {/* Confirmed settlement history */}
      {confirmedSettlements.length > 0 && (
        <div>
          <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-3">
            Settlement History
          </p>
          <div className="bg-surface border border-border rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.06)] divide-y divide-border px-5">
            {confirmedSettlements.map((s) => (
              <SettlementItem
                key={s.id}
                from={s.from_member}
                to={s.to_member}
                amount={s.amount}
                status="confirmed"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
