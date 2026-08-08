import { supabaseClient } from '../../config/supabase.js';

export async function listarParcelas(userId) {
    return supabaseClient
        .from('parcelas')
        .select('*')
        .eq('user_id', userId)
        .order('data_vencimento', { ascending: true });
}

export async function listarParcelasPorSimulacao(simulacaoId) {
    return supabaseClient
        .from('parcelas')
        .select('*')
        .eq('simulacao_id', simulacaoId)
        .order('numero_parcela', { ascending: true });
}

export async function criarParcela(parcela) {
    return supabaseClient.from('parcelas').insert([parcela]).select();
}

export async function atualizarParcela(id, updates) {
    return supabaseClient.from('parcelas').update(updates).eq('id', id).select();
}

export async function deletarParcela(id) {
    return supabaseClient.from('parcelas').delete().eq('id', id);
}

export async function listarParcelasPendentes(userId) {
    return supabaseClient
        .from('parcelas')
        .select('*')
        .eq('user_id', userId)
        .eq('paga', false)
        .order('data_vencimento', { ascending: true });
}