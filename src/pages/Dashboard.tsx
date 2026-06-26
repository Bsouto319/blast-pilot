import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Campanha } from '../types'
import { Send, CheckCircle, XCircle, Clock, Users, Zap, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', sending: 'Enviando...', completed: 'Concluída', cancelled: 'Cancelada'
}
const STATUS_COLOR: Record<string, string> = {
  draft: '#6b7280', sending: '#f59e0b', completed: '#10b981', cancelled: '#ef4444'
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('bp_campanhas').select('*').order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => { setCampanhas(data || []); setLoading(false) })
  }, [])

  const totalEnviados = campanhas.reduce((s, c) => s + c.total_enviados, 0)
  const totalFalhas = campanhas.reduce((s, c) => s + c.total_falhas, 0)
  const concluidas = campanhas.filter(c => c.status === 'completed').length

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 4, fontSize: 14 }}>Visão geral dos seus disparos</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard icon={<Zap size={22} color="#7c3aed" />} label="Campanhas" value={campanhas.length} color="#7c3aed" />
        <StatCard icon={<Send size={22} color="#3b82f6" />} label="Enviados" value={totalEnviados} color="#3b82f6" />
        <StatCard icon={<CheckCircle size={22} color="#10b981" />} label="Concluídas" value={concluidas} color="#10b981" />
        <StatCard icon={<XCircle size={22} color="#ef4444" />} label="Falhas" value={totalFalhas} color="#ef4444" />
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Campanhas Recentes</span>
          <Link to="/campanha/nova" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a78bfa', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Nova Campanha <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Carregando...</div>
        ) : campanhas.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Send size={40} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>Nenhuma campanha ainda.</p>
            <Link to="/campanha/nova" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', background: '#7c3aed', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
              Criar primeira campanha
            </Link>
          </div>
        ) : (
          campanhas.map((c, i) => (
            <Link key={c.id} to={`/campanha/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: i < campanhas.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: c.tipo === 'email' ? '#3b82f622' : '#10b98122', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {c.tipo === 'email' ? <Send size={16} color="#3b82f6" /> : <Users size={16} color="#10b981" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  {c.tipo === 'email' ? 'Email' : 'WhatsApp'} · {c.total_contatos} contatos · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{c.total_enviados}/{c.total_contatos}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>enviados</div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_COLOR[c.status] + '22', color: STATUS_COLOR[c.status] }}>
                  {c.status === 'sending' && <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />}
                  {STATUS_LABEL[c.status]}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
