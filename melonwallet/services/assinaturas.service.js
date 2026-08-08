import { listarAssinaturas as adapterListar, criarAssinatura as adapterCriar, atualizarAssinatura as adapterAtualizar, deletarAssinatura as adapterDeletar, listarAssinaturasAtivas as adapterListarAtivas } from '../adapters/supabase/assinaturas.adapter.js';

export async function listarAssinaturas(userId) {
    return adapterListar(userId);
}

export async function criarAssinatura(assinatura) {
    return adapterCriar(assinatura);
}

export async function atualizarAssinatura(id, updates) {
    return adapterAtualizar(id, updates);
}

export async function deletarAssinatura(id) {
    return adapterDeletar(id);
}

export async function listarAssinaturasAtivas(userId) {
    return adapterListarAtivas(userId);
}