import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function Login() {
  const [email, setEmail]     = useState('')
  const [pw, setPw]           = useState('')
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password: pw })
      login(data.token, data.user)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" sub="Sign in to your LLM-Shield account">
      <form onSubmit={submit}>
        {error && <ErrorBox msg={error} />}

        <Field label="Email address">
          <input className="auth-input" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoFocus />
        </Field>

        <Field label="Password">
          <div style={{ position: 'relative' }}>
            <input className="auth-input"
              type={show ? 'text' : 'password'} value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Enter your password" required
              style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShow(!show)} style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              color: '#606080', cursor: 'pointer', padding: 2,
            }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 20 }}>
          <Link to="/forgot-password" style={{ fontSize: 13, color: '#606080' }}
            onMouseEnter={e => e.target.style.color = '#4f8ef7'}
            onMouseLeave={e => e.target.style.color = '#606080'}
          >Forgot password?</Link>
        </div>

        <AuthBtn loading={loading} label="Sign in" loadingLabel="Signing in..." />
      </form>

      <AuthFooter text="Don't have an account?" linkTo="/signup" linkText="Sign up" />
    </AuthShell>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

export function AuthShell({ title, sub, children }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#08080f',
      backgroundImage: 'radial-gradient(ellipse 100% 50% at 50% -5%, rgba(79,142,247,0.09) 0%, transparent 60%)',
      padding: '20px 16px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        style={{ width: '100%', maxWidth: 380 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.26 }}
            style={{
              width: 48, height: 48, borderRadius: 13,
              background: 'rgba(79,142,247,0.12)',
              border: '1.5px solid rgba(79,142,247,0.32)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 0 22px rgba(79,142,247,0.16)',
            }}
          >
            <Shield size={22} color="#4f8ef7" />
          </motion.div>
          <h1 style={{
            fontSize: 22, fontWeight: 700,
            color: '#f2f2ff', letterSpacing: '-0.3px', marginBottom: 6,
          }}>
            {title}
          </h1>
          <p style={{ fontSize: 14, color: '#a8a8c8', lineHeight: 1.5 }}>
            {sub}
          </p>
        </div>

        <div style={{
          background: '#0f0f1a',
          border: '1px solid #2d2d42',
          borderRadius: 14,
          padding: '26px 28px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        }}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 13,
        fontWeight: 500, color: '#a8a8c8', marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function ErrorBox({ msg }) {
  if (!msg) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        background: 'rgba(248,113,113,0.08)',
        border: '1px solid rgba(248,113,113,0.28)',
        borderRadius: 8, padding: '10px 13px',
        color: '#f87171', fontSize: 13,
        marginBottom: 16, lineHeight: 1.5,
      }}
    >
      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      {msg}
    </motion.div>
  )
}

export function AuthBtn({ loading, label, loadingLabel }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: '100%', padding: '11px',
      background: loading ? 'rgba(79,142,247,0.4)' : '#4f8ef7',
      border: 'none', borderRadius: 8,
      color: '#fff', fontSize: 14, fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 7,
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => {
        if (!loading) {
          e.currentTarget.style.background = '#3a7ae8'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,142,247,0.35)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = loading ? 'rgba(79,142,247,0.4)' : '#4f8ef7'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {loading && <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
      {loading ? loadingLabel : label}
    </button>
  )
}

export function AuthFooter({ text, linkTo, linkText }) {
  return (
    <div style={{
      textAlign: 'center', marginTop: 22,
      fontSize: 13, color: '#a8a8c8',
    }}>
      {text}{' '}
      <Link to={linkTo} style={{ color: '#4f8ef7', fontWeight: 600 }}>
        {linkText}
      </Link>
    </div>
  )
}