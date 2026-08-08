-- Migration 008: Criar tabela de comprovantes (suporte a OCR)

CREATE TABLE IF NOT EXISTS comprovantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transacao_id UUID REFERENCES simulacoes(id) ON DELETE SET NULL,
    url_imagem TEXT NOT NULL,
    texto_extraido TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
    confidence NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comprovantes_user_id ON comprovantes(user_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_status ON comprovantes(status);
CREATE INDEX IF NOT EXISTS idx_comprovantes_transacao_id ON comprovantes(transacao_id);