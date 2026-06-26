-- BlastPilot Schema
-- Rodar no SQL Editor do Supabase: pvphgusjofufwtyiyviu

CREATE TABLE IF NOT EXISTS bp_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  nicho       TEXT NOT NULL DEFAULT 'Geral',
  tipo        TEXT NOT NULL CHECK (tipo IN ('email','whatsapp')),
  assunto     TEXT,
  conteudo    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bp_campanhas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('email','whatsapp')),
  template_id     UUID REFERENCES bp_templates(id),
  total_contatos  INT NOT NULL DEFAULT 0,
  total_enviados  INT NOT NULL DEFAULT 0,
  total_falhas    INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','completed','cancelled')),
  iniciado_at     TIMESTAMPTZ,
  concluido_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bp_contatos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id  UUID NOT NULL REFERENCES bp_campanhas(id) ON DELETE CASCADE,
  nome         TEXT,
  email        TEXT,
  telefone     TEXT,
  dados        JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  erro         TEXT,
  enviado_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bp_contatos_campanha_idx ON bp_contatos(campanha_id);
CREATE INDEX IF NOT EXISTS bp_contatos_status_idx ON bp_contatos(campanha_id, status);

-- RLS desabilitado (sistema privado, sem auth de usuários)
ALTER TABLE bp_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE bp_campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE bp_contatos  DISABLE ROW LEVEL SECURITY;
