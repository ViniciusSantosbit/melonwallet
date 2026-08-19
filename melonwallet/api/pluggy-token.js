export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
  }

  try {
    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'Credenciais da Pluggy ausentes no .env' }), { status: 500 });
    }

    // 1. Autenticação primária: Obter a API Key
    const authReq = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret })
    });

    const authData = await authReq.json();

    if (!authReq.ok) {
      return new Response(JSON.stringify({ error: 'Erro de Autenticação Pluggy', detalhes: authData }), { status: 502 });
    }

    // 2. Geração do Connect Token do Widget
    const tokenReq = await fetch('https://api.pluggy.ai/connect_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': authData.apiKey // Obrigatório ser X-API-KEY
      },
      body: JSON.stringify({
        // Para criar uma nova conexão via Widget, o body pode ser vazio ou conter clientUserId
      })
    });

    const tokenData = await tokenReq.json();

    if (!tokenReq.ok) {
       return new Response(JSON.stringify({ error: 'Falha ao gerar connectToken', detalhes: tokenData }), { status: 502 });
    }

    // A Pluggy devolve o token na propriedade 'accessToken'
    return new Response(JSON.stringify({ connectToken: tokenData.accessToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
