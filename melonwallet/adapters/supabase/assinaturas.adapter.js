import { supabaseClient } from '../../config/supabase.js';

export async function listarAssinaturas(userId) {
    return supabaseClient
        .from('assinaturas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
}

export async function criarAssinatura(assinatura) {
    return supabaseClient.from('assinaturas').insert([assinatura]).select();
}

export async function atualizarAssinatura(id, updates) {
    return supabaseClient.from('assinaturas').update(updates).eq('id', id).select();
}

export async function deletarAssinatura(id) {
    return supabaseClient.from('assinaturas').delete().eq('id', id);
}

export async function listarAssinaturasAtivas(userId) {
    return supabaseClient
        .from('assinaturas')
        .select('*')
        .eq('user_id', userId)
        .eq('ativa', true)
        .order('proximo_vencimento', { ascending: true });
}