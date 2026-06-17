import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../api/client'
import { AuthShell, Field, ErrorBox, SubmitBtn } from './Login'

export default function ForgotPassword() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [devToken, setDevToken] = useState('')
  const [error, setError]   = useState('')

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setSent(true)
      if (data.dev_token) setDevToken(data.dev_token)
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <AuthShell title="Reset password" sub="We'll send you a reset link">
      {!sent ? (
        <form onSubmit={submit}>
          <ErrorBox msg={error} />
          <Field label="Email">
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required />
          </Field>
          <div style={{ marginTop: 4 }}>
            <SubmitBtn loading={loading} label="Send reset link" loadingLabel="Sending..." />
          </div>
        </form>
      ) : (
        <motion.div
          initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
          style={{ textAlign:'center' }}
        >
          <div style={{
            width:44, height:44, borderRadius:'50%',
            background:'var(--blue-dim)', border:'1px solid rgba(59,130,246,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 14px',
          }}>
            <Mail size={20} color="var(--blue)" />
          </div>
          <div style={{ fontWeight:600, marginBottom:6 }}>Check your email</div>
          <div style={{ color:'var(--text2)', fontSize:13, marginBottom:16 }}>
            Reset link sent to <strong style={{color:'var(--text)'}}>{email}</strong>
          </div>
          {devToken && (
            <div style={{
              background:'var(--bg3)', border:'1px solid var(--amber-dim)',
              borderRadius:'var(--radius-sm)', padding:'10px 12px',
              textAlign:'left', marginBottom:12,
            }}>
              <div style={{ fontSize:11, color:'var(--amber)', marginBottom:4 }}>
                Dev mode — use this token at /reset-password?token=...
              </div>
              <div style={{ fontSize:10, fontFamily:'monospace', color:'var(--text3)', wordBreak:'break-all' }}>
                {devToken}
              </div>
            </div>
          )}
        </motion.div>
      )}
      <div style={{ textAlign:'center', marginTop:16 }}>
        <Link to="/login" style={{
          display:'inline-flex', alignItems:'center', gap:6,
          fontSize:13, color:'var(--text3)',
        }}>
          <ArrowLeft size={13} /> Back to login
        </Link>
      </div>
    </AuthShell>
  )
}