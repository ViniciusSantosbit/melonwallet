-- Migration 007: Criar tabela de assinaturas recorrentes

CREATE TABLE IF NOT EXISTS assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    frequencia TEXT NOT NULL CHECK (frequencia IN ('semanal', 'quinzenal', 'mensal', 'trimestral', 'anual')),
    proximo_vencimento DATE NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT true,
    conta_id UUID REFERENCES contas(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assinaturas_user_id ON assinaturas(user_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_ativa ON assinaturas(ativa);
CREATE INDEX IF NOT EXISTS idx_assinaturas_proximo_vencimento ON assinaturas(proximo_vencimento);