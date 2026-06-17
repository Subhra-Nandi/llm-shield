import { NavLink, useNavigate } from 'react-router-dom'
import { MessageCircle, BarChart2, Key, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

const NAV = [
  { to: '/chat',      icon: MessageCircle, label: 'Chat'      },
  { to: '/dashboard', icon: BarChart2,     label: 'Dashboard' },
  { to: '/keys',      icon: Key,           label: 'API Keys'  },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        style={{
          width: 230,
          flexShrink: 0,
          background: 'var(--bg2)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '22px 14px',
        }}
      >
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '4px 10px', marginBottom: 32,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--blue-dim)',
            border: '1px solid rgba(79,142,247,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--blue-glow)',
            flexShrink: 0,
          }}>
            <Shield size={18} color="#4f8ef7" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.2px' }}>
            LLM-Shield
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--blue-dim)' : 'transparent',
                    color: isActive ? 'var(--blue)' : 'var(--text2)',
                    border: `1px solid ${isActive ? 'rgba(79,142,247,0.25)' : 'transparent'}`,
                    fontSize: 15,
                    fontWeight: isActive ? 600 : 400,
                    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={18} />
                  {label}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{
            padding: '0 14px', marginBottom: 4,
            fontSize: 15, fontWeight: 500,
            color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.name}
          </div>
          <div style={{
            padding: '0 14px', marginBottom: 12,
            fontSize: 13, color: 'var(--text3)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.email}
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: 'none',
              color: 'var(--text3)', fontSize: 15,
              transition: 'color 0.15s, background 0.15s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--red)'
              e.currentTarget.style.background = 'var(--red-dim)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text3)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </motion.aside>

      {/* ── Page content ── */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </motion.main>
    </div>
  )
}