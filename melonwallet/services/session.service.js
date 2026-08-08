import { ROUTES } from '../config/constants.js';
import { clearSession, getUserId, hasSession, saveSession } from '../storage/session.storage.js';

export function redirectIfAuthenticated() {
    if (hasSession()) {
        window.location.href = ROUTES.DASHBOARD;
        return true;
    }
    return false;
}

export function requireAuth() {
    if (!getUserId()) {
        window.location.href = ROUTES.INDEX;
        return false;
    }
    return true;
}

export function persistSession(user) {
    saveSession(user);
}

export function logout() {
    clearSession();
    window.location.href = ROUTES.INDEX;
}
