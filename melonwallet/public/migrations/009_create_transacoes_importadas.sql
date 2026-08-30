-- Migration 009: Criar tabela de transações importadas (Open Finance)

CREATE TABLE IF NOT EXISTS transacoes_importadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conta_id UUID REFERENCES contas(id) ON DELETE SET NULL,
    extrato_id TEXT,
    data_transacao DATE NOT NULL,
    data_efetivacao DATE,
    descricao TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor NUMERIC(15, 2) NOT NULL,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    categoria_nome TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'categorizada', 'confirmada', 'rejeitada')),
    importado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_user_id ON transacoes_importadas(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_status ON transacoes_importadas(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_data ON transacoes_importadas(data_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_conta_id ON transacoes_importadas(conta_id);