import { listarCategorias as adapterListar, criarCategoria as adapterCriar, atualizarCategoria as adapterAtualizar, deletarCategoria as adapterDeletar, listarCategoriasPorTipo as adapterListarPorTipo } from '../adapters/supabase/categorias.adapter.js';

export async function listarCategorias(userId) {
    return adapterListar(userId);
}

export async function criarCategoria(categoria) {
    return adapterCriar(categoria);
}

export async function atualizarCategoria(id, updates) {
    return adapterAtualizar(id, updates);
}

export async function deletarCategoria(id) {
    return adapterDeletar(id);
}

export async function listarCategoriasPorTipo(userId, tipo) {
    return adapterListarPorTipo(userId, tipo);
}