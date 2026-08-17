-- Migration 013: Adicionar coluna categoria à tabela simulacoes

ALTER TABLE simulacoes
    ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Outros';
