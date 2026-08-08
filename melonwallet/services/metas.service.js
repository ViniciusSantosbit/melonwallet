import { listarMetas as adapterListar, criarMeta as adapterCriar, atualizarMeta as adapterAtualizar, deletarMeta as adapterDeletar, listarMetaAtiva as adapterListarAtiva } from '../adapters/supabase/metas.adapter.js';

export async function listarMetas(userId) {
    return adapterListar(userId);
}

export async function criarMeta(meta) {
    return adapterCriar(meta);
}

export async function atualizarMeta(id, updates) {
    return adapterAtualizar(id, updates);
}

export async function deletarMeta(id) {
    return adapterDeletar(id);
}

export async function listarMetaAtiva(userId) {
    return adapterListarAtiva(userId);
}