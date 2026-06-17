import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { AuthShell, Field, ErrorBox, AuthBtn, AuthFooter } from './Login'

export default function Signup() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (form.password !== form.confirm)
      return setError('Passwords do not match')
    if (form.password.length < 8)
      return setError('Password must be at least 8 characters')
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/signup', {
        name: form.name, email: form.email, password: form.password,
      })
      login(data.token, data.user)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <AuthShell title="Create account" sub="Start proxying LLM requests securely">
      <form onSubmit={submit}>
        {error && <ErrorBox msg={error} />}

        <Field label="Full name">
          <input className="auth-input" type="text" value={form.name}
            onChange={set('name')} placeholder="Your full name"
            required autoFocus />
        </Field>

        <Field label="Email address">
          <input className="auth-input" type="email" value={form.email}
            onChange={set('email')} placeholder="you@example.com" required />
        </Field>

        <Field label="Password">
          <div style={{ position: 'relative' }}>
            <input className="auth-input"
              type={showPw ? 'text' : 'password'} value={form.password}
              onChange={set('password')} placeholder="Minimum 8 characters"
              required minLength={8} style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              color: '#606080', cursor: 'pointer', padding: 2,
            }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm password">
          <input className="auth-input" type="password" value={form.confirm}
            onChange={set('confirm')} placeholder="Re-enter your password" required />
        </Field>

        <div style={{ marginTop: 6 }}>
          <AuthBtn loading={loading} label="Create account" loadingLabel="Creating..." />
        </div>
      </form>
      <AuthFooter text="Already have an account?" linkTo="/login" linkText="Sign in" />
    </AuthShell>
  )
}