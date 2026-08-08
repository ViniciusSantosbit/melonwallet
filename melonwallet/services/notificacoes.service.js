import { listarNotificacoes as adapterListar, criarNotificacao as adapterCriar, atualizarNotificacao as adapterAtualizar, deletarNotificacao as adapterDeletar, listarNotificacoesNaoLidas as adapterListarNaoLidas } from '../adapters/supabase/notificacoes.adapter.js';

export async function listarNotificacoes(userId) {
    return adapterListar(userId);
}

export async function criarNotificacao(notificacao) {
    return adapterCriar(notificacao);
}

export async function atualizarNotificacao(id, updates) {
    return adapterAtualizar(id, updates);
}

export async function deletarNotificacao(id) {
    return adapterDeletar(id);
}

export async function listarNotificacoesNaoLidas(userId) {
    return adapterListarNaoLidas(userId);
}