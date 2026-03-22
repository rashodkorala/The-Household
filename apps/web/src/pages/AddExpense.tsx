import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHouseholdStore } from '../store/householdStore'
import { useExpenses } from '../hooks/useExpenses'
import SplitSelector from '../components/SplitSelector'
import ReceiptScanner from '../components/ReceiptScanner'

const CATEGORIES = [
  'Groceries', 'Rent', 'Utilities', 'Internet', 'Takeaway',
  'Dining out', 'Transport', 'Subscriptions', 'Household supplies', 'Other',
] as const

const toCents = (dollars: number) => Math.round(dollars * 100)

export default function AddExpense() {
  const navigate = useNavigate()
  const members = useHouseholdStore((s) => s.members)
  const { addExpense } = useExpenses()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [paidBy, setPaidBy] = useState<number>(members[0]?.id || 0)
  const [splits, setSplits] = useState<{ member_id: number; amount: number }[]>([])
  const [splitType, setSplitType] = useState<string>('equal_all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const totalCents = toCents(parseFloat(amount) || 0)

  const handleSplitsChange = useCallback(
    (newSplits: { member_id: number; amount: number }[], type: string) => {
      setSplits(newSplits)
      setSplitType(type)
    },
    []
  )

  const handleReceiptResult = (total: number, desc: string) => {
    setAmount((total / 100).toFixed(2))
    if (desc) setDescription(desc)
  }

  const splitsValid =
    splitType !== 'custom' ||
    splits.reduce((s, sp) => s + sp.amount, 0) === totalCents

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!splitsValid) return
    setError('')
    setLoading(true)
    try {
      await addExpense({
        description,
        amount: totalCents,
        category,
        paid_by: paidBy,
        split_type: splitType,
        splits,
      })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-[28px] text-text-primary">Add Expense</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div className="text-center py-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-ui text-[18px] text-text-secondary">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="font-display text-[48px] font-light text-text-primary text-center bg-transparent border-none focus:outline-none w-48 placeholder:text-text-muted"
              required
            />
          </div>
          <p className="font-ui text-[13px] text-text-muted mt-1">CAD</p>
        </div>

        {/* Receipt Scanner */}
        <div className="text-center">
          <ReceiptScanner onResult={handleReceiptResult} />
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
            placeholder="e.g. Groceries at Metro"
            className="w-full bg-surface-alt border border-border rounded-sm font-ui text-[15px] text-text-primary px-4 py-3 focus:border-border-strong focus:outline-none placeholder:text-text-muted"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted block mb-2">
            Category
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(category === cat ? null : cat)}
                className={`font-ui text-[13px] whitespace-nowrap rounded-pill px-4 py-2 border transition-colors shrink-0 ${
                  category === cat
                    ? 'bg-btn text-surface border-btn'
                    : 'bg-transparent text-text-secondary border-border hover:border-border-strong'
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
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
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
          type="submit"
          disabled={loading || !splitsValid || totalCents === 0}
          className="w-full bg-btn text-surface font-ui font-medium text-[15px] tracking-[0.01em] rounded-pill py-4 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add expense'}
        </button>
      </form>
    </div>
  )
}
