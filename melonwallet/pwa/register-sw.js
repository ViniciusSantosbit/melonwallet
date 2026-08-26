const VAPID_PUBLIC_KEY = 'BH9J6Igqlx2xckxC7RHEMB3sO3cF3x9dRqSe1LxNMXs7kxjQ5R9JW0DQs0NkB0Y5d2xYHmLqXvY6j6v7aE3dFqg';
const SUBSCRIPTION_ENDPOINT = '/api/notifications/subscribe';

export function registerServiceWorker(logPrefix = '[PWA] SW registrado:') {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log(logPrefix, reg.scope))
            .catch((err) => console.error('[PWA] Erro:', err));
    });
}

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('[PWA] Este navegador não suporta notificações');
        return { success: false, error: 'Navegador não suporta notificações' };
    }

    try {
        const permission = await Notification.requestPermission();
        return {
            success: permission === 'granted',
            permission,
            error: permission === 'denied' ? 'Permissão negada pelo usuário' : null
        };
    } catch (err) {
        console.error('[PWA] Erro ao solicitar permissão:', err);
        return { success: false, error: err.message };
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return { success: false, error: 'Push notifications não suportadas' };
    }

    try {
        const permissionResult = await requestNotificationPermission();
        if (!permissionResult.success) {
            return permissionResult;
        }

        const registration = await navigator.serviceWorker.ready;

        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            await sendSubscriptionToServer(existingSubscription);
            return { success: true, subscription: existingSubscription, message: 'Já inscrito' };
        }

        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
        });

        await sendSubscriptionToServer(subscription);

        return { success: true, subscription, message: 'Inscrito com sucesso' };
    } catch (err) {
        console.error('[PWA] Erro ao inscrever para push:', err);
        return { success: false, error: err.message };
    }
}

export async function unsubscribeFromPushNotifications() {
    if (!('serviceWorker' in navigator)) {
        return { success: false, error: 'Service Worker não suportado' };
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();

            await fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint })
            }).catch(() => {});

            return { success: true, message: 'Inscrição removida' };
        }

        return { success: true, message: 'Nenhuma inscrição ativa' };
    } catch (err) {
        console.error('[PWA] Erro ao remover inscrição:', err);
        return { success: false, error: err.message };
    }
}

export async function getPushSubscriptionStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return { supported: false, subscribed: false };
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        return {
            supported: true,
            subscribed: !!subscription,
            permission: Notification.permission,
            subscription
        };
    } catch {
        return { supported: true, subscribed: false, permission: 'denied' };
    }
}

async function sendSubscriptionToServer(subscription) {
    const response = await fetch(SUBSCRIPTION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
    });

    if (!response.ok) {
        throw new Error(`Falha ao enviar subscription: ${response.status}`);
    }

    return response.json();
}

window.subscribeToPushNotifications = subscribeToPushNotifications;
window.unsubscribeFromPushNotifications = unsubscribeFromPushNotifications;
window.requestNotificationPermission = requestNotificationPermission;
window.getPushSubscriptionStatus = getPushSubscriptionStatus;
