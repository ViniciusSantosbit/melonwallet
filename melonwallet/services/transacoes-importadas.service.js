import { listarTransacoesImportadas as adapterListar, criarTransacaoImportada as adapterCriar, atualizarTransacaoImportada as adapterAtualizar, deletarTransacaoImportada as adapterDeletar, listarTransacoesImportadasPendentes as adapterListarPendentes } from '../adapters/supabase/transacoes-importadas.adapter.js';

export async function listarTransacoesImportadas(userId) {
    return adapterListar(userId);
}

export async function criarTransacaoImportada(transacao) {
    return adapterCriar(transacao);
}

export async function atualizarTransacaoImportada(id, updates) {
    return adapterAtualizar(id, updates);
}

export async function deletarTransacaoImportada(id) {
    return adapterDeletar(id);
}

export async function listarTransacoesImportadasPendentes(userId) {
    return adapterListarPendentes(userId);
}