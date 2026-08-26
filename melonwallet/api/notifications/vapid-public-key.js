export const config = { runtime: 'edge' };

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';

export default async function handler(req) {
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
    }

    if (!VAPID_PUBLIC_KEY) {
        return new Response(JSON.stringify({ error: 'VAPID não configurada' }), { status: 500 });
    }

    return new Response(JSON.stringify({ publicKey: VAPID_PUBLIC_KEY }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
