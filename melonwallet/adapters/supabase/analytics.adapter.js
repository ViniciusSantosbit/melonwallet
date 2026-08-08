import { supabaseClient } from '../../config/supabase.js';

export async function registrarEvento(evento) {
    return supabaseClient.from('analytics_events').insert([evento]);
}

export async function listarEventos(userId, filtro = {}) {
    let query = supabaseClient
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (filtro.evento) {
        query = query.eq('evento', filtro.evento);
    }

    if (filtro.categoria) {
        query = query.eq('categoria', filtro.categoria);
    }

    if (filtro.dataInicio && filtro.dataFim) {
        query = query.gte('created_at', filtro.dataInicio).lte('created_at', filtro.dataFim);
    }

    return query;
}