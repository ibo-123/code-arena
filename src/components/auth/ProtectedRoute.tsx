import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingState } from '../ui/LoadingState'

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingState />
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
