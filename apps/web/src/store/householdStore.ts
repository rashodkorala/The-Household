import { create } from 'zustand'

export interface Member {
  id: number
  household_id: number
  user_id: string
  display_name: string
  avatar_color: string
  joined_at: string
}

export interface Household {
  id: number
  name: string
  invite_code: string
  created_at: string
}

interface HouseholdState {
  household: Household | null
  members: Member[]
  loading: boolean
  setHousehold: (household: Household | null) => void
  setMembers: (members: Member[]) => void
  setLoading: (loading: boolean) => void
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  household: null,
  members: [],
  loading: true,
  setHousehold: (household) => set({ household }),
  setMembers: (members) => set({ members }),
  setLoading: (loading) => set({ loading }),
}))
