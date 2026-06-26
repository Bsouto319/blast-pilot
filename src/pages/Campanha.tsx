import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Campanha, Contato } from '../types'
import { ArrowLeft, CheckCircle, XCircle, Clock, Send, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_COLOR: Record<string, string> = { pending: '#6b7280', sent: '#10b981', failed: '#ef4444' }
const STATUS_LABEL: Record<string, string> = { pending: 'Pendente', sent: 'Enviado', failed: 'Falhou' }
const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock size={13} />, sent: <CheckCircle size={13} />, failed: <XCircle size={13} />
}

export default function CampanhaPage() {
  const { id } = useParams<{ id: string }>()
  const [camp, setCamp] = useState<Campanha | null>(null)
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all')

  async function load() {
    const [{ data: c }, { data: ct }] = await Promise.all([
      supabase.from('bp_campanhas').select('*').eq('id', id).single(),
      supabase.from('bp_contatos').select('*').eq('campanha_id', id).order('created_at')
    ])
    setCamp(c)
    setContatos(ct || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  // Auto-refresh when sending
  useEffect(() => {
    if (camp?.status === 'sending') {
      const t = setInterval(load, 3000)
      return () => clearInterval(t)
    }
  }, [camp?.status])

  const filtered = contatos.filter(c => filter === 'all' || c.status === filter)
  const pct = camp && camp.total_contatos > 0 ? Math.round((camp.total_enviados / camp.total_contatos) * 100) : 0

  if (loading) return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 64 }}>Carregando...</div>
  if (!camp) return <div style={{ textAlign: 'center', color: '#f87171', padding: 64 }}>Campanha não encontrada.</div>

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
        <ArrowLeft size={14} />Voltar
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>{camp.nome}</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
            {camp.tipo === 'email' ? 'Email' : 'WhatsApp'} · criada em {format(new Date(camp.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {camp.status === 'sending' && (
            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer' }}>
              <RefreshCw size={13} />Atualizar
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 20 }}>
          {[
            { label: 'Total', value: camp.total_contatos, color: '#7c3aed' },
            { label: 'Enviados', value: camp.total_enviados, color: '#10b981' },
            { label: 'Falhas', value: camp.total_falhas, color: '#ef4444' },
            { label: 'Progresso', value: `${pct}%`, color: '#3b82f6' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: camp.status === 'completed' ? '#10b981' : '#7c3aed', borderRadius: 99, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            Status: <span style={{ color: camp.status === 'completed' ? '#10b981' : camp.status === 'sending' ? '#f59e0b' : 'white', fontWeight: 600 }}>
              {camp.status === 'sending' ? 'Enviando...' : camp.status === 'completed' ? 'Concluída' : camp.status === 'cancelled' ? 'Cancelada' : 'Rascunho'}
            </span>
          </span>
          {camp.concluido_at && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              Concluída em {format(new Date(camp.concluido_at), "dd/MM HH:mm")}
            </span>
          )}
        </div>
      </div>

      {/* Contatos */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: 'white', fontWeight: 700, marginRight: 8 }}>Contatos</span>
          {(['all', 'sent', 'failed', 'pending'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: filter === f ? 700 : 400, background: filter === f ? '#7c3aed' : 'rgba(255,255,255,0.07)', color: filter === f ? 'white' : 'rgba(255,255,255,0.45)' }}>
              {f === 'all' ? 'Todos' : STATUS_LABEL[f]} ({contatos.filter(c => f === 'all' || c.status === f).length})
            </button>
          ))}
        </div>
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)' }}>Nenhum contato neste filtro.</div>
          ) : filtered.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: STATUS_COLOR[c.status] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: STATUS_COLOR[c.status], flexShrink: 0 }}>
                {STATUS_ICON[c.status]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{c.nome || c.email || c.telefone || 'Sem identificação'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  {c.email && <span>{c.email}</span>}{c.email && c.telefone && ' · '}{c.telefone && <span>{c.telefone}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[c.status] }}>{STATUS_LABEL[c.status]}</div>
                {c.enviado_at && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{format(new Date(c.enviado_at), 'HH:mm')}</div>}
                {c.erro && <div style={{ fontSize: 11, color: '#f87171', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.erro}>{c.erro}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
