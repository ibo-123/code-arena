import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingState } from '../ui'

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingState label="Verifying access..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
