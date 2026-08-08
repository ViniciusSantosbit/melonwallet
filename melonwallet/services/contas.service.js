import { listarContas as adapterListar, criarConta as adapterCriar, atualizarConta as adapterAtualizar, deletarConta as adapterDeletar, listarTodasContas as adapterListarTodas } from '../adapters/supabase/contas.adapter.js';

export async function listarContas(userId) {
    return adapterListar(userId);
}

export async function criarConta(conta) {
    return adapterCriar(conta);
}

export async function atualizarConta(id, updates) {
    return adapterAtualizar(id, updates);
}

export async function deletarConta(id) {
    return adapterDeletar(id);
}

export async function listarTodasContas(userId) {
    return adapterListarTodas(userId);
}