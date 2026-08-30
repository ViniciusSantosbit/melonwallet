import { supabaseClient } from '../../config/supabase.js';

export async function listar(userId) {
    return supabaseClient
        .from('simulacoes')
        .select('*')
        .eq('user_id', userId)
        .order('mes_referencia', { ascending: true });
}

export async function criar(simulacao) {
    return supabaseClient.from('simulacoes').insert([simulacao]).select();
}

export async function deletar(id) {
    return supabaseClient.from('simulacoes').delete().eq('id', id);
}

export async function criarMultiplos(simulacoes) {
    return supabaseClient.from('simulacoes').insert(simulacoes);
}