import { supabaseClient } from '../../config/supabase.js';

export async function listarCategorias(userId) {
    return supabaseClient
        .from('categorias')
        .select('*')
        .eq('user_id', userId)
        .order('nome', { ascending: true });
}

export async function criarCategoria(categoria) {
    return supabaseClient.from('categorias').insert([categoria]).select();
}

export async function atualizarCategoria(id, updates) {
    return supabaseClient.from('categorias').update(updates).eq('id', id).select();
}

export async function deletarCategoria(id) {
    return supabaseClient.from('categorias').delete().eq('id', id);
}

export async function listarCategoriasPorTipo(userId, tipo) {
    return supabaseClient
        .from('categorias')
        .select('*')
        .eq('user_id', userId)
        .eq('tipo', tipo)
        .order('nome', { ascending: true });
}