import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useExpenseStore } from '../store/expenseStore'
import { useHouseholdStore } from '../store/householdStore'

export function useExpenses() {
  const setExpenses = useExpenseStore((s) => s.setExpenses)
  const setLoading = useExpenseStore((s) => s.setLoading)
  const household = useHouseholdStore((s) => s.household)

  const fetchExpenses = useCallback(async () => {
    if (!household) return
    setLoading(true)

    const { data } = await supabase
      .from('expenses')
      .select('*, expense_splits(*)')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })

    setExpenses(data || [])
    setLoading(false)
  }, [household, setExpenses, setLoading])

  const addExpense = async (expense: {
    description: string
    amount: number
    category: string | null
    paid_by: number
    split_type: string
    splits: { member_id: number; amount: number }[]
  }) => {
    if (!household) return

    const { error } = await supabase.rpc('add_expense', {
      p_household_id: household.id,
      p_description: expense.description,
      p_amount: expense.amount,
      p_category: expense.category,
      p_paid_by: expense.paid_by,
      p_split_type: expense.split_type,
      p_splits: expense.splits,
    })

    if (error) throw error

    await fetchExpenses()
  }

  const updateExpense = async (
    id: number,
    updates: {
      description: string
      amount: number
      category: string | null
      paid_by: number
      split_type: string
      splits: { member_id: number; amount: number }[]
    }
  ) => {
    if (!household) return

    const { error } = await supabase.rpc('update_expense', {
      p_expense_id: id,
      p_description: updates.description,
      p_amount: updates.amount,
      p_category: updates.category,
      p_paid_by: updates.paid_by,
      p_split_type: updates.split_type,
      p_splits: updates.splits,
    })

    if (error) throw error
    await fetchExpenses()
  }

  const deleteExpense = async (id: number) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    await fetchExpenses()
  }

  return { fetchExpenses, addExpense, updateExpense, deleteExpense }
}
