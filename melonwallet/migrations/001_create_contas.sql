-- Migration 001: Criar tabela de contas bancárias
-- Suporta múltiplas contas para Open Finance e gestão financeira completa

CREATE TABLE IF NOT EXISTS contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    banco TEXT,
    tipo TEXT NOT NULL DEFAULT 'corrente',
    saldo_inicial NUMERIC(15, 2) DEFAULT 0,
    moeda TEXT NOT NULL DEFAULT 'BRL',
    is_ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contas_user_id ON contas(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_ativa ON contas(is_ativa);