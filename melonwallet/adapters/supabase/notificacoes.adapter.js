import { supabaseClient } from '../../config/supabase.js';

export async function listarNotificacoes(userId) {
    return supabaseClient
        .from('notificacoes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
}

export async function criarNotificacao(notificacao) {
    return supabaseClient.from('notificacoes').insert([notificacao]).select();
}

export async function atualizarNotificacao(id, updates) {
    return supabaseClient.from('notificacoes').update(updates).eq('id', id).select();
}

export async function deletarNotificacao(id) {
    return supabaseClient.from('notificacoes').delete().eq('id', id);
}

export async function listarNotificacoesNaoLidas(userId) {
    return supabaseClient
        .from('notificacoes')
        .select('*')
        .eq('user_id', userId)
        .eq('lida', false)
        .order('created_at', { ascending: false });
}