export const config = { runtime: 'edge' };

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
    }

    try {
        const { title, body, url } = await req.json();

        const response = await fetch(`${BACKEND_URL}/api/notifications/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, url })
        });

        const result = await response.json();

        return new Response(JSON.stringify(result), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('[API] Erro ao enviar notificação teste:', err);
        return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
    }
}
