import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: 16,
      background: 'var(--bg)',
    }}>
      <Shield size={32} color="var(--blue)" />
      <span style={{ color: 'var(--text2)', fontSize: '1rem' }}>Loading...</span>
    </div>
  )

  return user ? children : <Navigate to="/login" replace />
}