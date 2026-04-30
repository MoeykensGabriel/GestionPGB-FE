import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { token, user } = useAuth()

  if (!token) return <Navigate to="/login" replace />

  if (requiredRole) {
    const role = user?.role
    if (role !== requiredRole) return <Navigate to="/scan" replace />
  }

  return children
}
