import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/householdStore'
import { useExpenses } from './useExpenses'

export function useRealtime() {
  const household = useHouseholdStore((s) => s.household)
  const { fetchExpenses } = useExpenses()

  useEffect(() => {
    if (!household) return

    const channel = supabase
      .channel('household-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `household_id=eq.${household.id}`,
      }, () => fetchExpenses())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'settlements',
        filter: `household_id=eq.${household.id}`,
      }, () => fetchExpenses())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [household, fetchExpenses])
}
