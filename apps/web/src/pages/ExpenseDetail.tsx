import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHouseholdStore } from '../store/householdStore'
import { useExpenseStore } from '../store/expenseStore'
import { useExpenses } from '../hooks/useExpenses'
import { useSettlements, type Settlement } from '../hooks/useSettlements'
import SplitSelector from '../components/SplitSelector'
import MemberAvatar from '../components/MemberAvatar'

const CATEGORIES = [
  'Groceries', 'Rent', 'Utilities', 'Internet', 'Takeaway',
  'Dining out', 'Transport', 'Subscriptions', 'Household supplies', 'Other',
] as const

const CATEGORY_EMOJI: Record<string, string> = {
  'Groceries': '🛒', 'Rent': '🏠', 'Utilities': '💡', 'Internet': '📶',
  'Takeaway': '🥡', 'Dining out': '🍽️', 'Transport': '🚕',
  'Subscriptions': '📱', 'Household supplies': '🧹', 'Other': '📦',
}

const formatCAD = (cents: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)

const toCents = (dollars: number) => Math.round(dollars * 100)

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const members = useHouseholdStore((s) => s.members)
  const expenses = useExpenseStore((s) => s.expenses)
  const { updateExpense, deleteExpense } = useExpenses()
  const { settlements, fetchSettlements } = useSettlements()

  const expense = expenses.find((e) => e.id === Number(id))

  useEffect(() => {
    fetchSettlements()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState(expense?.description || '')
  const [amount, setAmount] = useState(expense ? (expense.amount / 100).toFixed(2) : '')
  const [category, setCategory] = useState<string | null>(expense?.category || null)
  const [paidBy, setPaidBy] = useState<number>(expense?.paid_by || 0)
  const [splits, setSplits] = useState<{ member_id: number; amount: number }[]>(
    expense?.expense_splits.map((s) => ({ member_id: s.member_id, amount: s.amount })) || []
  )
  const [splitType, setSplitType] = useState(expense?.split_type || 'equal_all')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isCreator = expense?.created_by === user?.id
  const totalCents = toCents(parseFloat(amount) || 0)

  const handleSplitsChange = useCallback(
    (newSplits: { member_id: number; amount: number }[], type: string) => {
      setSplits(newSplits)
      setSplitType(type)
    },
    []
  )

  const splitsValid =
    splitType !== 'custom' ||
    splits.reduce((s, sp) => s + sp.amount, 0) === totalCents

  const handleUpdate = async () => {
    if (!expense || !splitsValid) return
    setError('')
    setSaving(true)
    try {
      await updateExpense(expense.id, {
        description,
        amount: totalCents,
        category,
        paid_by: paidBy,
        split_type: splitType,
        splits,
      })
      setEditing(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!expense) return
    setSaving(true)
    try {
      await deleteExpense(expense.id)
      navigate('/expenses')
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (!expense) {
    return (
      <div className="py-12 text-center">
        <p className="font-ui text-[15px] text-text-muted">Expense not found</p>
        <button
          onClick={() => navigate('/expenses')}
          className="font-ui text-[13px] text-text-secondary underline mt-2"
        >
          Back to expenses
        </button>
      </div>
    )
  }

  const paidByMember = members.find((m) => m.id === expense.paid_by)
  const emoji = CATEGORY_EMOJI[expense.category || ''] || '📦'
  const createdAt = new Date(expense.created_at).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  // For each split member (who isn't the payer), compute how much they've settled
  // by looking at confirmed settlements from that member → payer
  const settledAmounts = useMemo(() => {
    const map: Record<number, { confirmed: number; pending: number }> = {}
    for (const split of expense.expense_splits) {
      if (split.member_id === expense.paid_by) continue
      let confirmed = 0
      let pending = 0
      for (const s of settlements) {
        if (s.from_member === split.member_id && s.to_member === expense.paid_by) {
          if (s.confirmed_by_from && s.confirmed_by_to) {
            confirmed += s.amount
          } else {
            pending += s.amount
          }
        }
      }
      map[split.member_id] = { confirmed, pending }
    }
    return map
  }, [expense, settlements])

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-[28px] text-text-primary">Edit Expense</h1>
          <button
            onClick={() => setEditing(false)}
            className="font-ui text-[13px] text-text-secondary"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-5">
          {/* Amount */}
          <div className="text-center py-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-ui text-[18px] text-text-secondary">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-display text-[42px] sm:text-[48px] font-light text-text-primary text-center bg-transparent border-none focus:outline-none w-full max-w-[200px]"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary px-4 py-3 focus:border-border-strong focus:outline-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
              Category
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 hide-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(category === cat ? null : cat)}
                  className={`touch-active font-ui text-[13px] whitespace-nowrap rounded-pill px-4 py-2.5 border transition-colors shrink-0 ${
                    category === cat
                      ? 'bg-btn text-surface border-btn'
                      : 'bg-transparent text-text-secondary border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
              Paid by
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(Number(e.target.value))}
              className="w-full bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary px-4 py-3 focus:border-border-strong focus:outline-none appearance-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.display_name}</option>
              ))}
            </select>
          </div>

          {/* Split */}
          <div>
            <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
              Split
            </label>
            <SplitSelector totalCents={totalCents} onSplitsChange={handleSplitsChange} />
          </div>

          {error && <p className="font-ui text-sm text-accent">{error}</p>}

          <button
            onClick={handleUpdate}
            disabled={saving || !splitsValid || totalCents === 0}
            className="w-full bg-btn text-surface font-ui font-medium text-[15px] rounded-pill py-4 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    )
  }

  // View mode
  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/expenses')}
        className="font-ui text-[13px] text-text-secondary flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-surface-alt flex items-center justify-center text-2xl mx-auto">
          {emoji}
        </div>
        <h1 className="font-heading text-[24px] text-text-primary">{expense.description}</h1>
        <p className="font-display text-[36px] sm:text-[44px] font-light text-text-primary leading-none">
          {formatCAD(expense.amount)}
        </p>
        <p className="font-ui text-[13px] text-text-muted">
          {expense.category || 'No category'} &middot; {createdAt}
        </p>
      </div>

      {/* Paid by */}
      <div className="bg-surface border border-border rounded-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-3">
          Paid by
        </p>
        <div className="flex items-center gap-3">
          <MemberAvatar
            name={paidByMember?.display_name || '?'}
            color={paidByMember?.avatar_color}
            size={36}
          />
          <span className="font-ui text-[15px] text-text-primary">
            {paidByMember?.display_name}
          </span>
        </div>
      </div>

      {/* Splits with settlement status */}
      <div className="bg-surface border border-border rounded-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-3">
          Split ({expense.split_type === 'equal_all' ? 'Equal' : expense.split_type === 'equal_selected' ? 'Selected' : 'Custom'})
        </p>
        <div className="space-y-4">
          {expense.expense_splits.map((split) => {
            const member = members.find((m) => m.id === split.member_id)
            const isPayer = split.member_id === expense.paid_by
            const status = settledAmounts[split.member_id]
            const confirmed = status?.confirmed || 0
            const pending = status?.pending || 0
            const remaining = Math.max(0, split.amount - confirmed)
            const fullySettled = !isPayer && confirmed >= split.amount

            return (
              <div key={split.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <MemberAvatar
                        name={member?.display_name || '?'}
                        color={member?.avatar_color}
                        size={32}
                      />
                      {isPayer && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface flex items-center justify-center">
                          <svg className="w-3 h-3 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-ui text-[14px] text-text-primary">
                        {member?.display_name}
                      </span>
                      {isPayer && (
                        <p className="font-ui text-[11px] text-text-muted">Paid</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-ui text-[14px] font-medium text-text-primary">
                      {formatCAD(split.amount)}
                    </span>
                    {!isPayer && (
                      <p className={`font-ui text-[11px] ${fullySettled ? 'text-positive' : pending > 0 ? 'text-amber-500' : 'text-accent'}`}>
                        {fullySettled
                          ? 'Settled'
                          : pending > 0
                            ? 'Pending'
                            : `Owes ${formatCAD(remaining)}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Settlement progress bar for non-payers */}
                {!isPayer && split.amount > 0 && (
                  <div className="mt-2 ml-11">
                    <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
                      <div className="h-full flex">
                        {confirmed > 0 && (
                          <div
                            className="h-full bg-positive transition-all"
                            style={{ width: `${Math.min(100, (confirmed / split.amount) * 100)}%` }}
                          />
                        )}
                        {pending > 0 && (
                          <div
                            className="h-full bg-amber-400 transition-all"
                            style={{ width: `${Math.min(100 - (confirmed / split.amount) * 100, (pending / split.amount) * 100)}%` }}
                          />
                        )}
                      </div>
                    </div>
                    {(confirmed > 0 || pending > 0) && (
                      <div className="flex gap-3 mt-1">
                        {confirmed > 0 && (
                          <span className="font-ui text-[11px] text-positive">
                            {formatCAD(confirmed)} settled
                          </span>
                        )}
                        {pending > 0 && (
                          <span className="font-ui text-[11px] text-amber-500">
                            {formatCAD(pending)} pending
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions — only for creator */}
      {isCreator && (
        <div className="space-y-3">
          <button
            onClick={() => setEditing(true)}
            className="w-full bg-btn text-surface font-ui font-medium text-[15px] rounded-pill py-4"
          >
            Edit expense
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full font-ui text-[15px] text-accent border border-border rounded-pill py-4 hover:border-accent transition-colors"
            >
              Delete expense
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 font-ui text-[14px] text-text-secondary border border-border rounded-pill py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 font-ui text-[14px] text-white bg-accent rounded-pill py-3 disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Confirm delete'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
