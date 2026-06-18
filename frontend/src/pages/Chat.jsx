import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader, ShieldAlert, Eye, Zap } from 'lucide-react'
import api from '../api/client'
import ReactMarkdown from 'react-markdown'

function Badge({ type, label }) {
  const map = {
    cache:   { bg: 'var(--blue-dim)',  color: 'var(--blue)',  icon: <Zap size={12} />        },
    pii:     { bg: 'var(--amber-dim)', color: 'var(--amber)', icon: <Eye size={12} />        },
    blocked: { bg: 'var(--red-dim)',   color: 'var(--red)',   icon: <ShieldAlert size={12} /> },
  }
  const s = map[type] || map.cache
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
      fontSize: 13, fontWeight: 500,
    }}>
      {s.icon}{label}
    </span>
  )
}

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 22,
      }}
    >
      <div style={{
        maxWidth: '70%',
        padding: '14px 18px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? 'var(--blue)' : 'var(--bg2)',
        border: isUser ? 'none' : '1px solid var(--border)',
        color: isUser ? '#fff' : 'var(--text)',
        fontSize: '1rem',
        lineHeight: 1.65,
      }}>
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>

      {msg.meta && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          marginTop: 7,
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          alignItems: 'center',
        }}>
          {msg.meta.cache_hit    && <Badge type="cache"   label="cache hit" />}
          {msg.meta.pii_redacted && <Badge type="pii"     label="PII redacted" />}
          {msg.meta.blocked      && <Badge type="blocked" label="blocked" />}
          {msg.meta.latency_ms != null && (
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              {msg.meta.latency_ms}ms · {msg.meta.provider}
              {msg.meta.prompt_tokens
                ? ` · ${msg.meta.prompt_tokens}+${msg.meta.completion_tokens} tok`
                : ''}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

function Typing() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '14px 18px' }}>
      {[0, 1, 2].map(i => (
        <motion.span key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--text3)', display: 'block',
          }}
        />
      ))}
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([{
    id: 0, role: 'assistant',
    content: "Hi! I'm LLM-Shield. Your requests are proxied, cached, and secured. Ask me anything.",
  }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottom                = useRef(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { id: Date.now(), role: 'user', content: input }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg]
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }))

      const { data } = await api.post('/v1/chat/completions', {
        model: 'gpt-4o', messages: history,
      })

      setMessages(m => [...m, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || 'No response',
        meta: data.shield,
      }])
    } catch (err) {
      const detail = err.response?.data?.detail
      const isInj  = typeof detail === 'object' && detail?.error === 'prompt_injection'
      const isRate = typeof detail === 'object' && detail?.error === 'rate_limit_exceeded'
      setMessages(m => [...m, {
        id: Date.now() + 1,
        role: 'assistant',
        content: isInj  ? '🛡️ Blocked: prompt injection detected.'
               : isRate ? '⏱️ Rate limit hit — wait a moment and retry.'
               :          `Error: ${typeof detail === 'string' ? detail : 'Something went wrong'}`,
        meta: { blocked: isInj },
      }])
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', padding: '32px 36px',
    }}>
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Chat</h1>
        <p style={{ color: 'var(--text2)', fontSize: '1rem', marginTop: 5 }}>
          Requests are proxied, cached, and secured by LLM-Shield.
        </p>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 14, padding: '24px 28px',
        marginBottom: 18,
      }}>
        <AnimatePresence>
          {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
        </AnimatePresence>
        {loading && <Typing />}
        <div ref={bottom} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
        <input
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Type a message and press Enter..."
          disabled={loading}
          style={{ flex: 1, fontSize: '1rem', padding: '15px 18px' }}
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{ padding: '15px 24px' }}
        >
          {loading ? <Loader size={20} className="spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  )
}