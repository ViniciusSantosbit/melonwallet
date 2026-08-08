export function registerServiceWorker(logPrefix = '[PWA] SW registrado:') {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log(logPrefix, reg.scope))
            .catch((err) => console.error('[PWA] Erro:', err));
    });
}
