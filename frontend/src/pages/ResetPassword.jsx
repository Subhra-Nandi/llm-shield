import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../api/client'
import { AuthShell, Field, ErrorBox, AuthBtn } from './Login'

export default function ResetPassword() {
  const [params]              = useSearchParams()
  const token                 = params.get('token') || ''
  const [pw, setPw]           = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const navigate              = useNavigate()

  const submit = async e => {
    e.preventDefault()
    if (pw !== confirm) return setError('Passwords do not match')
    if (pw.length < 8)  return setError('Password must be at least 8 characters')
    if (!token)         return setError('Missing token — use the link from your email')
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, new_password: pw })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The link may have expired.')
    } finally { setLoading(false) }
  }

  return (
    <AuthShell title="New password" sub="Choose a strong password for your account">
      {done ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '8px 0' }}
        >
          <CheckCircle size={42} color="#34d399"
            style={{ margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 7, color: '#f2f2ff' }}>
            Password updated!
          </div>
          <div style={{ color: '#a8a8c8', fontSize: 13 }}>
            Redirecting you to sign in...
          </div>
        </motion.div>
      ) : (
        <form onSubmit={submit}>
          {error && <ErrorBox msg={error} />}
          <Field label="New password">
            <input className="auth-input" type="password" value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Minimum 8 characters"
              required minLength={8} autoFocus />
          </Field>
          <Field label="Confirm new password">
            <input className="auth-input" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter your password" required />
          </Field>
          <div style={{ marginTop: 6 }}>
            <AuthBtn loading={loading} label="Reset password" loadingLabel="Resetting..." />
          </div>
        </form>
      )}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link to="/login" style={{ fontSize: 13, color: '#606080', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = '#4f8ef7'}
          onMouseLeave={e => e.target.style.color = '#606080'}
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  )
}