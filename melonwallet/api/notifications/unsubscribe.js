export const config = { runtime: 'edge' };

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
    }

    try {
        const { endpoint } = await req.json();

        if (!endpoint) {
            return new Response(JSON.stringify({ error: 'Endpoint obrigatório' }), { status: 400 });
        }

        const response = await fetch(`${BACKEND_URL}/api/notifications/unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint })
        });

        const result = await response.json();

        return new Response(JSON.stringify(result), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('[API] Erro ao remover subscription:', err);
        return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
    }
}
