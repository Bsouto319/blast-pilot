import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import { supabase } from '../lib/supabase'
import type { Template } from '../types'
import { Upload, FileText, MessageSquare, ArrowRight, ArrowLeft, Send, CheckCircle, Eye, X } from 'lucide-react'

type Step = 1 | 2 | 3 | 4
type TipoEnvio = 'email' | 'whatsapp'

interface Row { [key: string]: string }

const lbl: React.CSSProperties = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }
const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
const btnPrimary: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 28px', background: '#7c3aed', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { ...btnPrimary, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }

function applyVars(text: string, row: Row): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => row[k] || row[k.toLowerCase()] || `{{${k}}}`)
}

export default function NovaCampanha() {
  const nav = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [tipo, setTipo] = useState<TipoEnvio>('email')
  const [nome, setNome] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [cols, setCols] = useState<string[]>([])
  const [mapEmail, setMapEmail] = useState('')
  const [mapTel, setMapTel] = useState('')
  const [mapNome, setMapNome] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTpl, setSelectedTpl] = useState<Template | null>(null)
  const [previewRow, setPreviewRow] = useState<Row | null>(null)
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('bp_templates').select('*').eq('tipo', tipo).order('created_at', { ascending: false })
      .then(({ data }) => setTemplates(data || []))
  }, [tipo])

  function onCSV(file: File) {
    Papa.parse<Row>(file, {
      header: true, skipEmptyLines: true,
      complete: res => {
        setRows(res.data)
        const c = res.meta.fields || []
        setCols(c)
        setMapEmail(c.find(x => /email/i.test(x)) || '')
        setMapTel(c.find(x => /tel|phone|cel|whats/i.test(x)) || '')
        setMapNome(c.find(x => /nome|name/i.test(x)) || '')
      }
    })
  }

  async function launch() {
    if (!selectedTpl || rows.length === 0 || !nome) return
    setSending(true)
    const { data: camp } = await supabase.from('bp_campanhas').insert({
      nome, tipo, template_id: selectedTpl.id,
      total_contatos: rows.length, total_enviados: 0, total_falhas: 0, status: 'draft'
    }).select().single()
    if (!camp) { setSending(false); return }

    const contatos = rows.map(r => ({
      campanha_id: camp.id,
      nome: r[mapNome] || null,
      email: r[mapEmail] || null,
      telefone: r[mapTel] || null,
      dados: r,
      status: 'pending' as const
    }))
    await supabase.from('bp_contatos').insert(contatos)

    await supabase.functions.invoke('blast-send', { body: { campanha_id: camp.id } })
    nav(`/campanha/${camp.id}`)
  }

  const stepBar = (n: number, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= n ? '#7c3aed' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: step >= n ? 'white' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{n}</div>
      <span style={{ fontSize: 13, color: step >= n ? 'white' : 'rgba(255,255,255,0.3)', fontWeight: step === n ? 700 : 400 }}>{label}</span>
    </div>
  )

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Nova Campanha</h1>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        {stepBar(1, 'Tipo & Lista')}{stepBar(2, 'Template')}{stepBar(3, 'Preview')}{stepBar(4, 'Enviar')}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={lbl}>Nome da Campanha</label>
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Prospecção Contractors Junho" style={inp} />
            </div>
            <div>
              <label style={lbl}>Tipo de Envio</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['email', 'whatsapp'] as TipoEnvio[]).map(t => (
                  <button key={t} onClick={() => setTipo(t)}
                    style={{ flex: 1, padding: 20, background: tipo === t ? '#7c3aed22' : 'rgba(255,255,255,0.04)', border: `2px solid ${tipo === t ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: t === 'email' ? '#3b82f622' : '#10b98122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t === 'email' ? <FileText size={20} color="#3b82f6" /> : <MessageSquare size={20} color="#10b981" />}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{t === 'email' ? 'Email' : 'WhatsApp'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{t === 'email' ? 'Via Resend' : 'Via UAZAPI'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Importar Lista CSV/Planilha</label>
              <div onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 14, padding: 32, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#7c3aed')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}>
                <Upload size={32} color="rgba(255,255,255,0.25)" style={{ margin: '0 auto 12px' }} />
                {rows.length > 0 ? (
                  <div>
                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: 16 }}>{rows.length} contatos importados</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Colunas: {cols.join(', ')}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Clique para carregar CSV</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 4 }}>Suporta .csv, .txt (separado por vírgula)</div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && onCSV(e.target.files[0])} />
              </div>
            </div>
            {cols.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {(['email', 'whatsapp'] as const).includes(tipo) && tipo === 'email' && (
                  <div>
                    <label style={lbl}>Coluna Email</label>
                    <select value={mapEmail} onChange={e => setMapEmail(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">— selecionar —</option>
                      {cols.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                {tipo === 'whatsapp' && (
                  <div>
                    <label style={lbl}>Coluna Telefone</label>
                    <select value={mapTel} onChange={e => setMapTel(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">— selecionar —</option>
                      {cols.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={lbl}>Coluna Nome</label>
                  <select value={mapNome} onChange={e => setMapNome(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">— selecionar —</option>
                    {cols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(2)} disabled={!nome || rows.length === 0}
                style={{ ...btnPrimary, opacity: (!nome || rows.length === 0) ? 0.4 : 1 }}>
                Próximo <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Selecione o template de {tipo === 'email' ? 'email' : 'WhatsApp'} para esta campanha:</p>
            {templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)' }}>
                Nenhum template de {tipo} cadastrado.
                <br /><a href="/templates" style={{ color: '#a78bfa', fontSize: 13 }}>Criar template →</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                {templates.map(t => (
                  <div key={t.id} onClick={() => setSelectedTpl(t)}
                    style={{ padding: 16, border: `2px solid ${selectedTpl?.id === t.id ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, cursor: 'pointer', background: selectedTpl?.id === t.id ? '#7c3aed11' : 'transparent', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ color: 'white', fontWeight: 700 }}>{t.nome}</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{t.nicho}{t.assunto ? ` · ${t.assunto}` : ''}</div>
                      </div>
                      {selectedTpl?.id === t.id && <CheckCircle size={20} color="#7c3aed" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={btnSecondary}><ArrowLeft size={16} />Voltar</button>
              <button onClick={() => { setPreviewRow(rows[0]); setStep(3) }} disabled={!selectedTpl}
                style={{ ...btnPrimary, opacity: !selectedTpl ? 0.4 : 1 }}>
                Preview <Eye size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && selectedTpl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Preview do template com dados reais do CSV:</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Contato:</span>
                <select value={rows.indexOf(previewRow!)} onChange={e => setPreviewRow(rows[+e.target.value])}
                  style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
                  {rows.slice(0, 10).map((r, i) => <option key={i} value={i}>{r[mapNome] || r[mapEmail] || r[mapTel] || `#${i + 1}`}</option>)}
                </select>
              </div>
            </div>
            {tipo === 'email' && selectedTpl.assunto && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Assunto: </span>
                <span style={{ color: 'white', fontWeight: 600 }}>{applyVars(selectedTpl.assunto, previewRow!)}</span>
              </div>
            )}
            <div style={{ background: 'white', borderRadius: 12, padding: 24, color: '#111', fontSize: 14, maxHeight: 400, overflowY: 'auto' }}>
              {tipo === 'email' ? (
                <div dangerouslySetInnerHTML={{ __html: applyVars(selectedTpl.conteudo, previewRow!) }} />
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui', margin: 0 }}>{applyVars(selectedTpl.conteudo, previewRow!)}</pre>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={btnSecondary}><ArrowLeft size={16} />Voltar</button>
              <button onClick={() => setStep(4)} style={btnPrimary}>Confirmar <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#7c3aed22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={28} color="#7c3aed" />
            </div>
            <div>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: 22, margin: 0 }}>Tudo pronto!</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                Você vai disparar <strong style={{ color: 'white' }}>{rows.length} mensagens</strong> via <strong style={{ color: 'white' }}>{tipo === 'email' ? 'email' : 'WhatsApp'}</strong>
                <br />usando o template <strong style={{ color: '#a78bfa' }}>{selectedTpl?.nome}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 360 }}>
              <button onClick={() => setStep(3)} style={{ ...btnSecondary, flex: 1 }}><X size={14} />Cancelar</button>
              <button onClick={launch} disabled={sending}
                style={{ ...btnPrimary, flex: 2, opacity: sending ? 0.7 : 1, cursor: sending ? 'wait' : 'pointer' }}>
                <Send size={16} />{sending ? 'Enviando...' : 'Disparar Agora!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
