import { supabaseClient } from '../../config/supabase.js';

export async function listarComprovantes(userId) {
    return supabaseClient
        .from('comprovantes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
}

export async function criarComprovante(comprovante) {
    return supabaseClient.from('comprovantes').insert([comprovante]).select();
}

export async function atualizarComprovante(id, updates) {
    return supabaseClient.from('comprovantes').update(updates).eq('id', id).select();
}

export async function deletarComprovante(id) {
    return supabaseClient.from('comprovantes').delete().eq('id', id);
}

export async function listarComprovantesPendentes(userId) {
    return supabaseClient
        .from('comprovantes')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pendente')
        .order('created_at', { ascending: true });
}