import { supabaseClient } from '../../config/supabase.js';

export async function listarTransacoesImportadas(userId) {
    return supabaseClient
        .from('transacoes_importadas')
        .select('*')
        .eq('user_id', userId)
        .order('data_transacao', { ascending: false });
}

export async function criarTransacaoImportada(transacao) {
    return supabaseClient.from('transacoes_importadas').insert([transacao]).select();
}

export async function atualizarTransacaoImportada(id, updates) {
    return supabaseClient.from('transacoes_importadas').update(updates).eq('id', id).select();
}

export async function deletarTransacaoImportada(id) {
    return supabaseClient.from('transacoes_importadas').delete().eq('id', id);
}

export async function listarTransacoesImportadasPendentes(userId) {
    return supabaseClient
        .from('transacoes_importadas')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pendente')
        .order('data_transacao', { ascending: false });
}