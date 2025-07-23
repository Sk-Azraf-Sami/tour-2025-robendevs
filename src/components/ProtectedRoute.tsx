import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth'
import { NavigationService } from '../services/NavigationService'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!NavigationService.isAuthenticated(user)) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !NavigationService.canAccessAdmin(user)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
