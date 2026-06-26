export interface Template {
  id: string
  nome: string
  nicho: string
  tipo: 'email' | 'whatsapp'
  assunto: string | null
  conteudo: string
  created_at: string
}

export interface Campanha {
  id: string
  nome: string
  tipo: 'email' | 'whatsapp'
  template_id: string | null
  total_contatos: number
  total_enviados: number
  total_falhas: number
  status: 'draft' | 'sending' | 'completed' | 'cancelled'
  created_at: string
  iniciado_at: string | null
  concluido_at: string | null
}

export interface Contato {
  id: string
  campanha_id: string
  nome: string | null
  email: string | null
  telefone: string | null
  dados: Record<string, string>
  status: 'pending' | 'sent' | 'failed'
  erro: string | null
  enviado_at: string | null
  created_at: string
}
