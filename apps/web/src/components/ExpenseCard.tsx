import { useNavigate } from 'react-router-dom'
import { useHouseholdStore, type Member } from '../store/householdStore'
import type { Expense } from '../store/expenseStore'
import MemberAvatar from './MemberAvatar'

const CATEGORY_EMOJI: Record<string, string> = {
  'Groceries': '🛒',
  'Rent': '🏠',
  'Utilities': '💡',
  'Internet': '📶',
  'Takeaway': '🥡',
  'Dining out': '🍽️',
  'Transport': '🚕',
  'Subscriptions': '📱',
  'Household supplies': '🧹',
  'Other': '📦',
}

const formatCAD = (cents: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)

interface ExpenseCardProps {
  expense: Expense
  currentMemberId: number
}

export default function ExpenseCard({ expense, currentMemberId }: ExpenseCardProps) {
  const navigate = useNavigate()
  const members = useHouseholdStore((s) => s.members)
  const paidByMember = members.find((m) => m.id === expense.paid_by)
  const emoji = CATEGORY_EMOJI[expense.category || ''] || '📦'

  const mySplit = expense.expense_splits.find((s) => s.member_id === currentMemberId)
  const myAmount = mySplit?.amount || 0

  const isPayer = expense.paid_by === currentMemberId

  return (
    <div
      className="touch-active flex items-center gap-3 py-3.5 cursor-pointer -mx-2 px-2 rounded transition-colors active:bg-surface-alt/60"
      onClick={() => navigate(`/expense/${expense.id}`)}
    >
      <div className="w-9 h-9 rounded-full bg-surface-alt flex items-center justify-center text-lg shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-[15px] text-text-primary truncate">
          {expense.description}
        </p>
        <p className="font-ui text-[13px] text-text-muted">
          Paid by {isPayer ? 'you' : paidByMember?.display_name || 'Unknown'}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-ui font-medium text-[15px] text-text-primary">
          {formatCAD(expense.amount)}
        </p>
        {myAmount > 0 && (
          <p className={`font-ui text-[13px] ${isPayer ? 'text-positive' : 'text-accent'}`}>
            {formatCAD(myAmount)}
          </p>
        )}
      </div>
    </div>
  )
}
