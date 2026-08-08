-- Migration 012: Ativar Row Level Security (RLS) nas tabelas principais

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_rls_policy" ON usuarios
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "categorias_rls_policy" ON categorias
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "simulacoes_rls_policy" ON simulacoes
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "contas_rls_policy" ON contas
    FOR ALL
    USING (auth.uid() = user_id);
