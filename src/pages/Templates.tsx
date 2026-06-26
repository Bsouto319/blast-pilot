import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Template } from '../types'
import { Plus, FileText, MessageSquare, Trash2, Edit2, X, Save } from 'lucide-react'

const NICHOS = ['Geral', 'Saúde/Clínicas', 'Construção/Contractors', 'Imóveis', 'Limpeza', 'E-commerce', 'Restaurantes', 'Educação']

function TemplateModal({ t, onClose, onSave }: { t: Partial<Template> | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<Partial<Template>>(t || { tipo: 'email', nicho: 'Geral', nome: '', assunto: '', conteudo: '' })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.nome || !form.conteudo) return
    setSaving(true)
    if (form.id) {
      await supabase.from('bp_templates').update({ nome: form.nome, nicho: form.nicho, tipo: form.tipo, assunto: form.assunto, conteudo: form.conteudo }).eq('id', form.id)
    } else {
      await supabase.from('bp_templates').insert({ nome: form.nome, nicho: form.nicho, tipo: form.tipo, assunto: form.assunto || null, conteudo: form.conteudo })
    }
    setSaving(false)
    onSave()
  }

  const set = (k: keyof Template, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#1a1033', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ color: 'white', fontWeight: 800, fontSize: 18, margin: 0 }}>{form.id ? 'Editar' : 'Novo'} Template</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value as 'email' | 'whatsapp')} style={sel}>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Nicho</label>
              <select value={form.nicho} onChange={e => set('nicho', e.target.value)} style={sel}>
                {NICHOS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Nome do Template</label>
            <input value={form.nome || ''} onChange={e => set('nome', e.target.value)} placeholder="Ex: Prospecção Contractors" style={inp} />
          </div>
          {form.tipo === 'email' && (
            <div>
              <label style={lbl}>Assunto do Email</label>
              <input value={form.assunto || ''} onChange={e => set('assunto', e.target.value)} placeholder="Ex: Novidade para {{nome}}" style={inp} />
            </div>
          )}
          <div>
            <label style={lbl}>
              Conteúdo
              <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
                Use {'{{nome}}'}, {'{{email}}'}, {'{{telefone}}'} e outras colunas do CSV
              </span>
            </label>
            <textarea value={form.conteudo || ''} onChange={e => set('conteudo', e.target.value)} placeholder={form.tipo === 'email' ? 'HTML ou texto do email...' : 'Texto da mensagem WhatsApp...'} rows={10}
              style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
          </div>
          <button onClick={save} disabled={saving || !form.nome || !form.conteudo}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0', background: saving ? '#6d28d9' : '#7c3aed', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 15, cursor: saving ? 'wait' : 'pointer', opacity: (!form.nome || !form.conteudo) ? 0.5 : 1 }}>
            <Save size={16} />{saving ? 'Salvando...' : 'Salvar Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }
const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Template> | null | false>(false)
  const [filterNicho, setFilterNicho] = useState('Todos')
  const [filterTipo, setFilterTipo] = useState<'todos' | 'email' | 'whatsapp'>('todos')

  async function load() {
    const { data } = await supabase.from('bp_templates').select('*').order('created_at', { ascending: false })
    setTemplates(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function del(id: string) {
    if (!confirm('Excluir este template?')) return
    await supabase.from('bp_templates').delete().eq('id', id)
    setTemplates(t => t.filter(x => x.id !== id))
  }

  const filtered = templates.filter(t =>
    (filterNicho === 'Todos' || t.nicho === filterNicho) &&
    (filterTipo === 'todos' || t.tipo === filterTipo)
  )

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {modal !== false && (
        <TemplateModal t={modal} onClose={() => setModal(false)} onSave={() => { setModal(false); load() }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Templates</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 4, fontSize: 14 }}>{templates.length} templates cadastrados</p>
        </div>
        <button onClick={() => setModal(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#7c3aed', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          <Plus size={16} />Novo Template
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterNicho} onChange={e => setFilterNicho(e.target.value)} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', fontSize: 13, cursor: 'pointer', outline: 'none' }}>
          <option value="Todos">Todos os nichos</option>
          {NICHOS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {(['todos', 'email', 'whatsapp'] as const).map(v => (
          <button key={v} onClick={() => setFilterTipo(v)}
            style={{ padding: '8px 14px', background: filterTipo === v ? '#7c3aed' : 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: filterTipo === v ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', fontWeight: filterTipo === v ? 700 : 400 }}>
            {v === 'todos' ? 'Todos' : v === 'email' ? 'Email' : 'WhatsApp'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 48 }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <FileText size={48} color="rgba(255,255,255,0.08)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhum template encontrado.</p>
          <button onClick={() => setModal(null)} style={{ marginTop: 12, padding: '10px 20px', background: '#7c3aed', border: 'none', borderRadius: 10, color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            Criar Template
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(t => (
            <div key={t.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: t.tipo === 'email' ? '#3b82f622' : '#10b98122', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {t.tipo === 'email' ? <FileText size={16} color="#3b82f6" /> : <MessageSquare size={16} color="#10b981" />}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{t.nome}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{t.nicho}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => setModal(t)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}><Edit2 size={13} /></button>
                  <button onClick={() => del(t.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#f87171' }}><Trash2 size={13} /></button>
                </div>
              </div>
              {t.assunto && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 10px' }}>📧 {t.assunto}</div>}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'hidden', lineHeight: 1.5 }}>
                {t.conteudo.slice(0, 200)}{t.conteudo.length > 200 ? '...' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
