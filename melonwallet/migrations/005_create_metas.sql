-- Migration 005: Criar tabela de metas (migração de localStorage para Supabase)

CREATE TABLE IF NOT EXISTS metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL DEFAULT 'Meta de investimento',
    valor_alvo NUMERIC(15, 2) NOT NULL,
    valor_atual NUMERIC(15, 2) DEFAULT 0,
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE,
    concluida BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metas_user_id ON metas(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_concluida ON metas(concluida);