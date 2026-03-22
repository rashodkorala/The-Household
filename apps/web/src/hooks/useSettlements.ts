import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/householdStore'

export interface Settlement {
  id: number
  from_member: number
  to_member: number
  amount: number
  confirmed_by_from: boolean
  confirmed_by_to: boolean
  settled_at: string
}

export function useSettlements() {
  const household = useHouseholdStore((s) => s.household)
  const [settlements, setSettlements] = useState<Settlement[]>([])

  const fetchSettlements = useCallback(async () => {
    if (!household) return
    const { data } = await supabase
      .from('settlements')
      .select('*')
      .eq('household_id', household.id)
      .order('settled_at', { ascending: false })
    setSettlements(data || [])
  }, [household])

  const requestSettlement = useCallback(async (from: number, to: number, amount: number) => {
    const { error } = await supabase.rpc('request_settlement', {
      p_from_member: from,
      p_to_member: to,
      p_amount: amount,
    })
    if (error) throw error
    await fetchSettlements()
  }, [fetchSettlements])

  const confirmSettlement = useCallback(async (settlementId: number) => {
    const { error } = await supabase.rpc('confirm_settlement', {
      p_settlement_id: settlementId,
    })
    if (error) throw error
    await fetchSettlements()
  }, [fetchSettlements])

  return { settlements, fetchSettlements, requestSettlement, confirmSettlement }
}

/** Only fully confirmed settlements adjust balances */
export function adjustBalancesForSettlements(
  balances: Record<number, number>,
  settlements: Settlement[]
): Record<number, number> {
  const adj = { ...balances }
  for (const s of settlements) {
    if (!s.confirmed_by_from || !s.confirmed_by_to) continue
    adj[s.from_member] = (adj[s.from_member] || 0) + s.amount
    adj[s.to_member] = (adj[s.to_member] || 0) - s.amount
  }
  return adj
}
