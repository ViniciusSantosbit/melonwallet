import { supabaseClient } from '../../config/supabase.js';

export async function listarMetas(userId) {
    return supabaseClient
        .from('metas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
}

export async function criarMeta(meta) {
    return supabaseClient.from('metas').insert([meta]).select();
}

export async function atualizarMeta(id, updates) {
    return supabaseClient.from('metas').update(updates).eq('id', id).select();
}

export async function deletarMeta(id) {
    return supabaseClient.from('metas').delete().eq('id', id);
}

export async function listarMetaAtiva(userId) {
    const { data, error } = await supabaseClient
        .from('metas')
        .select('*')
        .eq('user_id', userId)
        .eq('concluida', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}