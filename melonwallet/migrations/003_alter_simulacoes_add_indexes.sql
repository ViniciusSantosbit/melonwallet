-- Migration 003: Adicionar índices, timestamps e colunas Open Finance à tabela simulacoes

ALTER TABLE simulacoes
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES contas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual' CHECK (origem IN ('manual', 'ocr', 'open_finance'));

CREATE INDEX IF NOT EXISTS idx_simulacoes_user_id ON simulacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_simulacoes_mes_referencia ON simulacoes(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_simulacoes_tipo ON simulacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_simulacoes_deleted_at ON simulacoes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_simulacoes_conta_id ON simulacoes(conta_id);
CREATE INDEX IF NOT EXISTS idx_simulacoes_origem ON simulacoes(origem);