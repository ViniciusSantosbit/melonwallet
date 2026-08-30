import { listarParcelas as adapterListar, listarParcelasPorSimulacao as adapterListarPorSimulacao, criarParcela as adapterCriar, atualizarParcela as adapterAtualizar, deletarParcela as adapterDeletar, listarParcelasPendentes as adapterListarPendentes } from '/adapters/supabase/parcelas.adapter.js';

export async function listarParcelas(userId) {
    return adapterListar(userId);
}

export async function listarParcelasPorSimulacao(simulacaoId) {
    return adapterListarPorSimulacao(simulacaoId);
}

export async function criarParcela(parcela) {
    return adapterCriar(parcela);
}

export async function atualizarParcela(id, updates) {
    return adapterAtualizar(id, updates);
}

export async function deletarParcela(id) {
    return adapterDeletar(id);
}

export async function listarParcelasPendentes(userId) {
    return adapterListarPendentes(userId);
}