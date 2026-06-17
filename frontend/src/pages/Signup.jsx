import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { AuthShell, Field, ErrorBox, SubmitBtn, AuthFooter } from './Login'

export default function Signup() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Passwords do not match')
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/signup', {
        name: form.name, email: form.email, password: form.password,
      })
      login(data.token, data.user)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed')
    } finally { setLoading(false) }
  }

  return (
    <AuthShell title="Create account" sub="Start proxying LLM requests securely">
      <form onSubmit={submit}>
        <ErrorBox msg={error} />
        {[
          { label:'Full name',        key:'name',     type:'text',     ph:'Your name'        },
          { label:'Email',            key:'email',    type:'email',    ph:'you@example.com'  },
          { label:'Password',         key:'password', type:'password', ph:'Min 8 characters' },
          { label:'Confirm password', key:'confirm',  type:'password', ph:'••••••••'          },
        ].map(({ label, key, type, ph }) => (
          <Field key={key} label={label}>
            <input className="input" type={type} value={form[key]}
              onChange={set(key)} placeholder={ph} required
              minLength={key === 'password' ? 8 : undefined} />
          </Field>
        ))}
        <div style={{ marginTop: 4 }}>
          <SubmitBtn loading={loading} label="Create account" loadingLabel="Creating..." />
        </div>
      </form>
      <AuthFooter text="Already have an account?" linkTo="/login" linkText="Sign in" />
    </AuthShell>
  )
}