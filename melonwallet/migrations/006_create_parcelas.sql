-- Migration 006: Criar tabela de parcelamentos

CREATE TABLE IF NOT EXISTS parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    simulacao_id UUID NOT NULL REFERENCES simulacoes(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL,
    total_parcelas INTEGER NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    paga BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parcelas_user_id ON parcelas(user_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_simulacao_id ON parcelas(simulacao_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento ON parcelas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_paga ON parcelas(paga);