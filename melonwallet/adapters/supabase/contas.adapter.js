import { supabaseClient } from '../../config/supabase.js';

export async function listarContas(userId) {
    return supabaseClient
        .from('contas')
        .select('*')
        .eq('user_id', userId)
        .eq('is_ativa', true)
        .order('created_at', { ascending: true });
}

export async function criarConta(conta) {
    return supabaseClient.from('contas').insert([conta]).select();
}

export async function atualizarConta(id, updates) {
    return supabaseClient.from('contas').update(updates).eq('id', id).select();
}

export async function deletarConta(id) {
    return supabaseClient.from('contas').delete().eq('id', id);
}

export async function listarTodasContas(userId) {
    return supabaseClient
        .from('contas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
}