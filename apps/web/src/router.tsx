import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useHouseholdStore } from './store/householdStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthStore()
  const { household, loading: householdLoading } = useHouseholdStore()
  const location = useLocation()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="font-ui text-[15px] text-text-muted">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (householdLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="font-ui text-[15px] text-text-muted">Loading...</p>
      </div>
    )
  }

  if (!household && location.pathname !== '/household-setup') {
    return <Navigate to="/household-setup" replace />
  }

  return <>{children}</>
}
