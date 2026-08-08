import { listarComprovantes as adapterListar, criarComprovante as adapterCriar, atualizarComprovante as adapterAtualizar, deletarComprovante as adapterDeletar, listarComprovantesPendentes as adapterListarPendentes } from '../adapters/supabase/comprovantes.adapter.js';

export async function listarComprovantes(userId) {
    return adapterListar(userId);
}

export async function criarComprovante(comprovante) {
    return adapterCriar(comprovante);
}

export async function atualizarComprovante(id, updates) {
    return adapterAtualizar(id, updates);
}

export async function deletarComprovante(id) {
    return adapterDeletar(id);
}

export async function listarComprovantesPendentes(userId) {
    return adapterListarPendentes(userId);
}