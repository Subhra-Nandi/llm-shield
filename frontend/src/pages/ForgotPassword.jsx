import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../api/client'
import { AuthShell, Field, ErrorBox, AuthBtn } from './Login'

export default function ForgotPassword() {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [devToken, setDevToken] = useState('')
  const [error, setError]       = useState('')

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setSent(true)
      if (data.dev_token) setDevToken(data.dev_token)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <AuthShell title="Reset password" sub="Enter your email to receive a reset link">
      {!sent ? (
        <form onSubmit={submit}>
          {error && <ErrorBox msg={error} />}
          <Field label="Email address">
            <input className="auth-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoFocus />
          </Field>
          <div style={{ marginTop: 6 }}>
            <AuthBtn loading={loading} label="Send reset link" loadingLabel="Sending..." />
          </div>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '4px 0' }}
        >
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'rgba(79,142,247,0.12)',
            border: '1.5px solid rgba(79,142,247,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Mail size={20} color="#4f8ef7" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 7, color: '#f2f2ff' }}>
            Check your email
          </div>
          <div style={{ color: '#a8a8c8', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            If <strong style={{ color: '#f2f2ff' }}>{email}</strong> is registered,
            a reset link has been sent.
          </div>
          {devToken && (
            <div style={{
              background: '#181825',
              border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: 8, padding: '12px 14px',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 11, color: '#fbbf24', marginBottom: 5, fontWeight: 600 }}>
                Dev mode — token for /reset-password?token=...
              </div>
              <div style={{
                fontSize: 10, fontFamily: 'monospace',
                color: '#606080', wordBreak: 'break-all', lineHeight: 1.6,
              }}>
                {devToken}
              </div>
            </div>
          )}
        </motion.div>
      )}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link to="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 13, color: '#606080', transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#4f8ef7'}
          onMouseLeave={e => e.currentTarget.style.color = '#606080'}
        >
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </div>
    </AuthShell>
  )
}