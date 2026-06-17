import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, Loader } from 'lucide-react'
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
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password: pw })
      login(data.token, data.user)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <AuthShell title="Welcome back" sub="Sign in to your LLM-Shield account">
      <form onSubmit={submit}>
        <ErrorBox msg={error} />
        <Field label="Email address">
          <input className="input" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoFocus />
        </Field>
        <Field label="Password">
          <div style={{ position: 'relative' }}>
            <input className="input"
              type={show ? 'text' : 'password'} value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Enter your password" required
              style={{ paddingRight: 52 }} />
            <button type="button" onClick={() => setShow(!show)} style={{
              position: 'absolute', right: 16, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              color: 'var(--text3)', padding: 4,
            }}>
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </Field>
        <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 28 }}>
          <Link to="/forgot-password" style={{ fontSize: 15, color: 'var(--text3)' }}
            onMouseEnter={e => e.target.style.color = 'var(--blue)'}
            onMouseLeave={e => e.target.style.color = 'var(--text3)'}
          >Forgot password?</Link>
        </div>
        <SubmitBtn loading={loading} label="Sign in" loadingLabel="Signing in..." />
      </form>
      <AuthFooter text="Don't have an account?" linkTo="/signup" linkText="Sign up" />
    </AuthShell>
  )
}

// ─── Shared auth components used by all auth pages ────────────────────────────

export function AuthShell({ title, sub, children }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(79,142,247,0.13) 0%, transparent 65%)',
      padding: '32px 24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 500 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'var(--blue-dim)',
              border: '2px solid rgba(79,142,247,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: 'var(--blue-glow)',
            }}
          >
            <Shield size={34} color="var(--blue)" />
          </motion.div>
          <h1 style={{
            fontSize: '2rem', fontWeight: 800,
            letterSpacing: '-0.5px', marginBottom: 10,
            color: 'var(--text)',
          }}>
            {title}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '1.05rem', lineHeight: 1.5 }}>
            {sub}
          </p>
        </div>

        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '40px 44px',
          boxShadow: '0 16px 50px rgba(0,0,0,0.45)',
        }}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{
        display: 'block', fontSize: '0.95rem',
        fontWeight: 500, color: 'var(--text2)',
        marginBottom: 9, letterSpacing: '0.01em',
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
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--red-dim)',
        border: '1px solid rgba(248,113,113,0.4)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px 18px', color: 'var(--red)',
        fontSize: '0.95rem', marginBottom: 24, lineHeight: 1.5,
      }}
    >{msg}</motion.div>
  )
}

export function SubmitBtn({ loading, label, loadingLabel }) {
  return (
    <button type="submit" disabled={loading}
      className="btn btn-primary"
      style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}
    >
      {loading && <Loader size={18} className="spin" />}
      {loading ? loadingLabel : label}
    </button>
  )
}

export function AuthFooter({ text, linkTo, linkText }) {
  return (
    <div style={{
      textAlign: 'center', marginTop: 32,
      fontSize: '1rem', color: 'var(--text2)',
    }}>
      {text}{' '}
      <Link to={linkTo} style={{ color: 'var(--blue)', fontWeight: 600 }}>
        {linkText}
      </Link>
    </div>
  )
}