import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Zap, LayoutDashboard, FileText, PlusCircle, LogOut } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Templates from './pages/Templates'
import NovaCampanha from './pages/NovaCampanha'
import Campanha from './pages/Campanha'

const PASS = import.meta.env.VITE_ADMIN_PASSWORD

function Login({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  function handle(e: React.FormEvent) {
    e.preventDefault()
    if (pw === PASS) { sessionStorage.setItem('bp_auth', '1'); onLogin() }
    else setErr(true)
  }
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c1a 0%, #1a0f3c 100%)' }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#7c3aed', boxShadow: '0 0 32px #7c3aed66' }}>
            <Zap size={32} color="white" />
          </div>
          <h1 className="text-3xl font-black text-white">BlastPilot</h1>
          <p style={{ color: '#a78bfa99', fontSize: 14 }} className="mt-1">Disparos em massa inteligentes</p>
        </div>
        <form onSubmit={handle} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24 }}>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(false) }}
            placeholder="Senha de acesso"
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: 'white', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
          />
          {err && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>Senha incorreta</p>}
          <button type="submit" style={{ width: '100%', padding: '13px 0', background: '#7c3aed', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}

function Layout({ onLogout }: { onLogout: () => void }) {
  const navBase: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #0f0c1a 0%, #1a0f3c 100%)' }}>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(15,12,26,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px #7c3aed55' }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>BlastPilot</span>
        </div>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          <NavLink to="/" end style={({ isActive }) => ({ ...navBase, background: isActive ? '#7c3aed' : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.45)' })}>
            <LayoutDashboard size={14} />Dashboard
          </NavLink>
          <NavLink to="/templates" style={({ isActive }) => ({ ...navBase, background: isActive ? '#7c3aed' : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.45)' })}>
            <FileText size={14} />Templates
          </NavLink>
          <NavLink to="/campanha/nova" style={({ isActive }) => ({ ...navBase, background: isActive ? '#7c3aed' : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.45)' })}>
            <PlusCircle size={14} />Nova Campanha
          </NavLink>
        </nav>
        <button onClick={onLogout} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: 'rgba(255,255,255,0.3)' }} title="Sair">
          <LogOut size={16} />
        </button>
      </header>
      <main style={{ flex: 1, padding: 24 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/campanha/nova" element={<NovaCampanha />} />
          <Route path="/campanha/:id" element={<Campanha />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const [auth, setAuth] = useState(!!sessionStorage.getItem('bp_auth'))
  if (!auth) return <Login onLogin={() => setAuth(true)} />
  return (
    <BrowserRouter>
      <Layout onLogout={() => { sessionStorage.removeItem('bp_auth'); setAuth(false) }} />
    </BrowserRouter>
  )
}
