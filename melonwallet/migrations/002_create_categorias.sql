-- Migration 002: Criar tabela de categorias funcional
-- Substitui a tabela categorias orphanada por uma com relacionamento ao usuário

CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'investimento')),
    cor TEXT DEFAULT '#f1f09d',
    icone TEXT,
    is_padrao BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo);