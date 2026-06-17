import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Zap, DollarSign, ShieldAlert, Eye, Database } from 'lucide-react'
import api from '../api/client'

function MetricCard({ icon: Icon, label, value, color, delay }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const num = parseFloat(value) || 0
    if (num === 0) { setDisplay(value); return }
    let start = 0
    const step = num / 30
    const timer = setInterval(() => {
      start += step
      if (start >= num) { setDisplay(value); clearInterval(timer) }
      else setDisplay(typeof value === 'string' && value.includes('%')
        ? start.toFixed(1) + '%'
        : typeof value === 'string' && value.includes('$')
        ? '$' + start.toFixed(4)
        : Math.floor(start).toString()
      )
    }, 30)
    return () => clearInterval(timer)
  }, [value])

  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      transition={{ delay, duration:0.3 }}
      style={{
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:'var(--radius)', padding:'18px 20px',
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <div style={{
          width:32, height:32, borderRadius:8,
          background: color + '20', display:'flex',
          alignItems:'center', justifyContent:'center',
        }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize:12, color:'var(--text2)' }}>{label}</span>
      </div>
      <div style={{ fontSize:26, fontWeight:600, color }}>{display}</div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stats').then(r => setStats(r.data)).finally(() => setLoading(false))
    const t = setInterval(() => api.get('/stats').then(r => setStats(r.data)), 10000)
    return () => clearInterval(t)
  }, [])

  if (loading) return (
    <div style={{ padding:24, color:'var(--text3)', fontSize:13 }}>Loading stats...</div>
  )

  const cards = [
    { icon:Database,    label:'Total requests',  value: stats.total_requests.toString(), color:'var(--blue)'  },
    { icon:Zap,         label:'Cache hit rate',  value: stats.cache_hit_rate + '%',      color:'var(--green)' },
    { icon:DollarSign,  label:'Total cost',      value: '$' + stats.total_cost_usd,      color:'var(--amber)' },
    { icon:ShieldAlert, label:'Blocked',         value: stats.total_blocked.toString(),  color:'var(--red)'   },
    { icon:Eye,         label:'PII detected',    value: stats.total_pii_detected.toString(), color:'var(--amber)' },
    { icon:TrendingUp,  label:'Avg latency',     value: stats.avg_latency_ms + 'ms',     color:'var(--blue)'  },
  ]

  const breakdown = [
    { name:'Cache hits', value: stats.cache_hits,                                  fill:'var(--blue)' },
    { name:'LLM calls',  value: stats.total_requests - stats.cache_hits - stats.total_blocked, fill:'var(--green)' },
    { name:'Blocked',    value: stats.total_blocked,                                fill:'var(--red)'  },
  ]

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:'1.25rem', fontWeight:700 }}>Dashboard</h1>
        <p style={{ color:'var(--text2)', fontSize:'0.9375rem', marginTop:4 }}>
          Live metrics — refreshes every 10 seconds
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {cards.map((c, i) => <MetricCard key={c.label} {...c} delay={i * 0.06} />)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20 }}
        >
          <div style={{ fontSize:13, fontWeight:500, marginBottom:16 }}>Request breakdown</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={breakdown} barSize={32}>
              <XAxis dataKey="name" tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, fontSize:12 }}
                cursor={{ fill:'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {breakdown.map((b, i) => (
                  <rect key={i} fill={b.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
          style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20 }}
        >
          <div style={{ fontSize:13, fontWeight:500, marginBottom:8 }}>Provider status</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
            {[
              { name:'GPT-4o',      role:'Primary',  status:'online' },
              { name:'OpenRouter',  role:'Failover', status:'standby' },
              { name:'Redis cache', role:'Cache',    status:'online' },
            ].map(p => (
              <div key={p.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{p.role}</div>
                </div>
                <span style={{
                  fontSize:11, padding:'3px 10px', borderRadius:99,
                  background: p.status === 'online' ? 'var(--green-dim)' : 'var(--blue-dim)',
                  color: p.status === 'online' ? 'var(--green)' : 'var(--blue)',
                }}>{p.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}