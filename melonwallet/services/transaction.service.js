import { listar as adapterListar, criar as adapterCriar, deletar as adapterDeletar } from '../adapters/supabase/transaction.adapter.js';

export async function listarSimulacoes(userId) {
    return adapterListar(userId);
}

export async function criarSimulacao(simulacao) {
    return adapterCriar(simulacao);
}

export async function deletarSimulacao(id) {
    return adapterDeletar(id);
}