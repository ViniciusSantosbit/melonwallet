import { login as adapterLogin, register as adapterRegister } from '/adapters/supabase/auth.adapter.js';

export async function login(email, senha) {
    return adapterLogin(email, senha);
}

export async function register({ nome, email, senha }) {
    return adapterRegister({ nome, email, senha });
}