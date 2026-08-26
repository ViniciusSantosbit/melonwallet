export const config = { runtime: 'edge' };

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
    }

    try {
        const subscription = await req.json();

        if (!subscription || !subscription.endpoint) {
            return new Response(JSON.stringify({ error: 'Subscription inválida' }), { status: 400 });
        }

        const response = await fetch(`${BACKEND_URL}/api/notifications/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });

        const result = await response.json();

        return new Response(JSON.stringify(result), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('[API] Erro ao registrar subscription:', err);
        return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
    }
}
