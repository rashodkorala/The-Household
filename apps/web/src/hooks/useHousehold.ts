import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/householdStore'
import { useAuthStore } from '../store/authStore'

export function useHousehold() {
  const { setHousehold, setMembers, setLoading } = useHouseholdStore()
  const user = useAuthStore((s) => s.user)

  const fetchHousehold = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return null
    }
    setLoading(true)

    try {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (memberError || !member) {
        setHousehold(null)
        setMembers([])
        setLoading(false)
        return null
      }

      const { data: household } = await supabase
        .from('households')
        .select('*')
        .eq('id', member.household_id)
        .maybeSingle()

      if (!household) {
        setHousehold(null)
        setMembers([])
        setLoading(false)
        return null
      }

      const { data: members } = await supabase
        .from('members')
        .select('*')
        .eq('household_id', member.household_id)

      setHousehold(household)
      setMembers(members || [])
      setLoading(false)
      return household
    } catch {
      setHousehold(null)
      setMembers([])
      setLoading(false)
      return null
    }
  }, [user, setHousehold, setMembers, setLoading])

  const createHousehold = async (name: string, displayName: string) => {
    if (!user) return

    // Use RPC to create household and member atomically,
    // avoiding the RLS issue where we can't SELECT the household
    // back before the member row exists.
    const { data, error } = await supabase.rpc('create_household', {
      household_name: name,
      member_display_name: displayName,
    })

    if (error) throw error

    await fetchHousehold()
  }

  const joinHousehold = async (inviteCode: string, displayName: string) => {
    if (!user) return

    const { error } = await supabase.rpc('join_household', {
      invite: inviteCode,
      member_display_name: displayName,
    })

    if (error) throw new Error('Invalid invite code')

    await fetchHousehold()
  }

  return { fetchHousehold, createHousehold, joinHousehold }
}
