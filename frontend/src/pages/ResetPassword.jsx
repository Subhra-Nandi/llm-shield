import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../api/client'
import { AuthShell, Field, ErrorBox, SubmitBtn } from './Login'

export default function ResetPassword() {
  const [params]            = useSearchParams()
  const token               = params.get('token') || ''
  const [pw, setPw]         = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [done, setDone]     = useState(false)
  const navigate            = useNavigate()

  const submit = async e => {
    e.preventDefault()
    if (pw !== confirm) return setError('Passwords do not match')
    if (!token) return setError('Missing reset token — check your link')
    setLoading(true); setError('')
    try {
      await api.post('/auth/reset-password', { token, new_password: pw })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed')
    } finally { setLoading(false) }
  }

  return (
    <AuthShell title="New password" sub="Enter your new password below">
      {done ? (
        <motion.div
          initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
          style={{ textAlign:'center', padding:'8px 0' }}
        >
          <CheckCircle size={40} color="var(--green)" style={{ margin:'0 auto 14px', display:'block' }} />
          <div style={{ fontWeight:600, marginBottom:6 }}>Password reset!</div>
          <div style={{ color:'var(--text2)', fontSize:13 }}>Redirecting to login...</div>
        </motion.div>
      ) : (
        <form onSubmit={submit}>
          <ErrorBox msg={error} />
          <Field label="New password">
            <input className="input" type="password" value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Min 8 characters" required minLength={8} />
          </Field>
          <Field label="Confirm password">
            <input className="input" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" required />
          </Field>
          <div style={{ marginTop: 4 }}>
            <SubmitBtn loading={loading} label="Reset password" loadingLabel="Resetting..." />
          </div>
        </form>
      )}
      <div style={{ textAlign:'center', marginTop:16 }}>
        <Link to="/login" style={{ fontSize:13, color:'var(--text3)' }}>Back to login</Link>
      </div>
    </AuthShell>
  )
}