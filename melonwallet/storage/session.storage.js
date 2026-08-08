import { STORAGE_KEYS } from '../config/constants.js';

export function getUserId() {
    return localStorage.getItem(STORAGE_KEYS.USER_ID);
}

export function getUserName() {
    return localStorage.getItem(STORAGE_KEYS.USER_NOME);
}

export function saveSession(user) {
    localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);
    localStorage.setItem(STORAGE_KEYS.USER_NOME, user.nome);
}

export function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_NOME);
}

export function hasSession() {
    return Boolean(getUserId());
}
