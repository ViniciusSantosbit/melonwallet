import { registrarEvento as adapterRegistrar, listarEventos as adapterListar } from '../adapters/supabase/analytics.adapter.js';

export async function registrarEvento(evento) {
    return adapterRegistrar(evento);
}

export async function listarEventos(userId, filtro = {}) {
    return adapterListar(userId, filtro);
}