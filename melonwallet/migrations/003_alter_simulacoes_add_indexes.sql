-- Migration 003: Adicionar índices e timestamps à tabela simulacoes

ALTER TABLE simulacoes
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_simulacoes_user_id ON simulacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_simulacoes_mes_referencia ON simulacoes(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_simulacoes_tipo ON simulacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_simulacoes_deleted_at ON simulacoes(deleted_at);