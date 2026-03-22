import { create } from 'zustand'

export interface ExpenseSplit {
  id: number
  expense_id: number
  member_id: number
  amount: number
  percentage: number | null
}

export interface Expense {
  id: number
  household_id: number
  description: string
  amount: number
  currency: string
  category: string | null
  paid_by: number
  split_type: string
  receipt_url: string | null
  created_by: string
  created_at: string
  expense_splits: ExpenseSplit[]
}

interface ExpenseState {
  expenses: Expense[]
  loading: boolean
  setExpenses: (expenses: Expense[]) => void
  setLoading: (loading: boolean) => void
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  loading: true,
  setExpenses: (expenses) => set({ expenses }),
  setLoading: (loading) => set({ loading }),
}))
