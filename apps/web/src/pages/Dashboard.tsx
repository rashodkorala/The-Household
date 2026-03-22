import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHouseholdStore } from '../store/householdStore'
import { useExpenseStore } from '../store/expenseStore'
import { useExpenses } from '../hooks/useExpenses'
import { useSettlements, adjustBalancesForSettlements } from '../hooks/useSettlements'
import { computeBalances } from '../lib/balances'
import BalanceBar from '../components/BalanceBar'
import ExpenseCard from '../components/ExpenseCard'

const formatCAD = (cents: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const household = useHouseholdStore((s) => s.household)
  const members = useHouseholdStore((s) => s.members)
  const expenses = useExpenseStore((s) => s.expenses)
  const { fetchExpenses } = useExpenses()
  const { settlements, fetchSettlements } = useSettlements()

  useEffect(() => {
    fetchExpenses()
    fetchSettlements()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentMember = members.find((m) => m.user_id === user?.id)

  const balances = useMemo(() => {
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

  const now = new Date()
  const monthlyTotal = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, e) => sum + e.amount, 0)
  }, [expenses])

  const recentExpenses = expenses.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-[28px] text-text-primary">
          Welcome, {currentMember?.display_name || 'there'}
        </h1>
        <Link
          to="/settings"
          className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </Link>
      </div>

      {currentMember && (
        <BalanceBar balances={balances} currentMemberId={currentMember.id} />
      )}

      {/* Active Groups */}
      <div>
        <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-3">
          Active Groups
        </p>
        <div className="bg-surface border border-border rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.06)] divide-y divide-border">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-5 py-4"
          >
            <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center text-lg">
              🏠
            </div>
            <div className="flex-1">
              <p className="font-heading text-[16px] text-text-primary">{household?.name}</p>
              <p className="font-ui text-[13px] text-text-muted">{members.length} participants</p>
            </div>
            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Monthly Total */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          This month's spending
        </p>
        <p className="font-display text-[32px] sm:text-[36px] font-light text-text-primary mt-1">
          {formatCAD(monthlyTotal)}
        </p>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
            Transactions
          </p>
          <Link to="/expenses" className="font-ui text-[13px] text-text-secondary underline">
            View all
          </Link>
        </div>
        <div className="bg-surface border border-border rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {recentExpenses.length > 0 ? (
            <div className="divide-y divide-border px-5">
              {recentExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  currentMemberId={currentMember?.id || 0}
                />
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="font-ui text-[15px] text-text-muted">No expenses yet</p>
              <Link
                to="/add-expense"
                className="font-ui text-[13px] text-text-secondary underline mt-1 inline-block"
              >
                Add your first expense
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link
          to="/settle-up"
          className="flex-1 text-center font-ui text-[13px] text-text-secondary border border-border rounded-pill py-3 hover:border-border-strong transition-colors"
        >
          Settle up
        </Link>
      </div>
    </div>
  )
}
