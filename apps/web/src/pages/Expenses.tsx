import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHouseholdStore } from '../store/householdStore'
import { useExpenseStore } from '../store/expenseStore'
import { useExpenses } from '../hooks/useExpenses'
import ExpenseCard from '../components/ExpenseCard'

export default function Expenses() {
  const user = useAuthStore((s) => s.user)
  const members = useHouseholdStore((s) => s.members)
  const expenses = useExpenseStore((s) => s.expenses)
  const loading = useExpenseStore((s) => s.loading)
  const { fetchExpenses } = useExpenses()

  useEffect(() => {
    fetchExpenses()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentMember = members.find((m) => m.user_id === user?.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-[28px] text-text-primary">Expenses</h1>
        <Link
          to="/add-expense"
          className="bg-btn text-surface font-ui font-medium text-[13px] rounded-pill px-5 py-2.5"
        >
          + Add
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <p className="font-ui text-[15px] text-text-muted">Loading expenses...</p>
        </div>
      ) : expenses.length > 0 ? (
        <div className="bg-surface border border-border rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="divide-y divide-border px-5">
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currentMemberId={currentMember?.id || 0}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="font-ui text-[15px] text-text-muted">No expenses yet</p>
          <Link
            to="/add-expense"
            className="font-ui text-[13px] text-text-secondary underline mt-2 inline-block"
          >
            Add your first expense
          </Link>
        </div>
      )}
    </div>
  )
}
