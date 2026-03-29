import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireCRM?: boolean
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireCRM = false,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, isCRM } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wow-violet border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={isCRM ? '/crm/dashboard' : '/settings'} replace />
  }

  if (requireCRM && !isCRM) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/settings'} replace />
  }

  return <>{children}</>
}
