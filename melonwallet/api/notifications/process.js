export const config = { runtime: 'edge' };

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const CRON_SECRET = process.env.CRON_SECRET || '';

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
    }

    if (CRON_SECRET) {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
        }
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/notifications/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        return new Response(JSON.stringify(result), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('[API] Erro ao processar notificações:', err);
        return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
    }
}
