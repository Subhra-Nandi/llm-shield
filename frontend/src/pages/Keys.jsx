import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Copy, Trash2, Check } from 'lucide-react'

export default function Keys() {
  const [keys, setKeys]     = useState([])
  const [copied, setCopied] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName]   = useState('')

  // For now use the master key as demo
  useEffect(() => {
    setKeys([
      { id:1, name:'Default key', key:'dev-master-key', requests:0, cost:'$0.00', status:'active', created:'Today' },
    ])
  }, [])

  const copyKey = (key, id) => {
    navigator.clipboard.writeText(key)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:600 }}>API Keys</h1>
          <p style={{ color:'var(--text2)', fontSize:13, marginTop:2 }}>
            Manage access keys for the LLM-Shield proxy.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(!creating)}>
          <Plus size={15}/> Create key
        </button>
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }}
            style={{
              background:'var(--bg2)', border:'1px solid var(--blue)',
              borderRadius:'var(--radius)', padding:20, marginBottom:16, overflow:'hidden',
            }}
          >
            <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>New API key</div>
            <div style={{ display:'flex', gap:10 }}>
              <input className="input" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Key name (e.g. Production app)" style={{ flex:1 }} />
              <button className="btn btn-primary" onClick={() => {
                if (!newName.trim()) return
                const newKey = 'sk-shield-' + Math.random().toString(36).slice(2,10)
                setKeys(k => [...k, {
                  id: Date.now(), name: newName, key: newKey,
                  requests:0, cost:'$0.00', status:'active', created:'Just now',
                }])
                setNewName(''); setCreating(false)
              }}>
                Create
              </button>
              <button className="btn btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
        <div style={{
          display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 80px',
          padding:'10px 20px', borderBottom:'1px solid var(--border)',
          fontSize:11, color:'var(--text3)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em',
        }}>
          <span>Key</span><span>Requests</span><span>Cost</span><span>Status</span><span>Actions</span>
        </div>
        <AnimatePresence>
          {keys.map((k, i) => (
            <motion.div key={k.id}
              initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 80px',
                padding:'14px 20px', borderBottom:'1px solid var(--border)',
                alignItems:'center',
              }}
            >
              <div>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:3 }}>{k.name}</div>
                <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--text3)' }}>
                  {k.key.slice(0,14)}•••{k.key.slice(-4)}
                </div>
              </div>
              <span style={{ fontSize:13 }}>{k.requests}</span>
              <span style={{ fontSize:13 }}>{k.cost}</span>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:5,
                fontSize:11, padding:'3px 10px', borderRadius:99, width:'fit-content',
                background: k.status==='active' ? 'var(--green-dim)' : 'var(--red-dim)',
                color: k.status==='active' ? 'var(--green)' : 'var(--red)',
              }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor' }}/>
                {k.status}
              </span>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => copyKey(k.key, k.id)} style={{
                  width:28, height:28, borderRadius:'var(--radius-sm)',
                  background:'var(--bg3)', border:'1px solid var(--border)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: copied===k.id ? 'var(--green)' : 'var(--text3)',
                }}>
                  {copied===k.id ? <Check size={13}/> : <Copy size={13}/>}
                </button>
                <button onClick={() => setKeys(ks => ks.filter(x => x.id !== k.id))} style={{
                  width:28, height:28, borderRadius:'var(--radius-sm)',
                  background:'var(--bg3)', border:'1px solid var(--border)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'var(--text3)',
                }}
                  onMouseEnter={e => e.currentTarget.style.color='var(--red)'}
                  onMouseLeave={e => e.currentTarget.style.color='var(--text3)'}
                >
                  <Trash2 size={13}/>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}