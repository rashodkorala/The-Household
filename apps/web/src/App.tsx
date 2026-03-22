import { useEffect } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useHousehold } from './hooks/useHousehold'
import { useRealtime } from './hooks/useRealtime'
import { useAuthStore } from './store/authStore'
import { useHouseholdStore } from './store/householdStore'
import { ProtectedRoute } from './router'
import Login from './pages/Login'
import Register from './pages/Register'
import HouseholdSetup from './pages/HouseholdSetup'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import AddExpense from './pages/AddExpense'
import SettleUp from './pages/SettleUp'
import Settings from './pages/Settings'
import ExpenseDetail from './pages/ExpenseDetail'

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const active = (path: string) =>
    location.pathname === path ? 'text-text-primary' : 'text-text-muted'

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      <main className="flex-1 w-full max-w-app mx-auto px-4 sm:px-6 pt-4 pb-28">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-app mx-auto flex items-center justify-around py-1.5">
          <Link to="/dashboard" className={`touch-active flex flex-col items-center gap-0.5 p-2 min-w-[48px] min-h-[48px] justify-center ${active('/dashboard')}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            {location.pathname === '/dashboard' && <div className="w-1 h-1 rounded-full bg-text-primary" />}
          </Link>

          <Link to="/expenses" className={`touch-active flex flex-col items-center gap-0.5 p-2 min-w-[48px] min-h-[48px] justify-center ${active('/expenses')}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            {location.pathname === '/expenses' && <div className="w-1 h-1 rounded-full bg-text-primary" />}
          </Link>

          <Link
            to="/add-expense"
            className="touch-active w-12 h-12 bg-btn rounded-full flex items-center justify-center -mt-4 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
          >
            <svg className="w-6 h-6 text-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Link>

          <Link to="/settle-up" className={`touch-active flex flex-col items-center gap-0.5 p-2 min-w-[48px] min-h-[48px] justify-center ${active('/settle-up')}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {location.pathname === '/settle-up' && <div className="w-1 h-1 rounded-full bg-text-primary" />}
          </Link>

          <Link to="/settings" className={`touch-active flex flex-col items-center gap-0.5 p-2 min-w-[48px] min-h-[48px] justify-center ${active('/settings')}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location.pathname === '/settings' && <div className="w-1 h-1 rounded-full bg-text-primary" />}
          </Link>
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  useAuth()
  const user = useAuthStore((s) => s.user)
  const { fetchHousehold } = useHousehold()

  useEffect(() => {
    if (user) {
      fetchHousehold()
    }
  }, [user, fetchHousehold])

  useRealtime()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/household-setup"
        element={
          <ProtectedRoute>
            <HouseholdSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Layout><Expenses /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-expense"
        element={
          <ProtectedRoute>
            <Layout><AddExpense /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settle-up"
        element={
          <ProtectedRoute>
            <Layout><SettleUp /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expense/:id"
        element={
          <ProtectedRoute>
            <Layout><ExpenseDetail /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
