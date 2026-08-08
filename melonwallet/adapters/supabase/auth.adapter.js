import { supabaseClient } from '../../config/supabase.js';

export async function login(email, senha) {
    return supabaseClient
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .single();
}

export async function register({ nome, email, senha }) {
    return supabaseClient
        .from('usuarios')
        .insert([{ nome, email, senha }])
        .select();
}