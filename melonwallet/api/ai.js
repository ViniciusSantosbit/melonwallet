export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
  }

  try {
    const { prompt } = await req.json();
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY não configurada no servidor' }), { status: 500 });
    }

    // Lista atualizada com os modelos da nova geração exibidos na sua tela
    const modelsToTry = [
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-1.5-flash'
    ];

    let data = null;
    let success = false;
    let lastError = null;

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt || "Olá" }] }]
        })
      });

      data = await response.json();

      if (response.ok) {
        success = true;
        break;
      } else {
        lastError = data;
      }
    }

    if (!success) {
      console.error("Erro retornado pelo Google:", lastError);
      return new Response(JSON.stringify({ error: "Erro na API Gemini", detalhes: lastError }), { status: 502 });
    }

    const respostaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, a IA não retornou conteúdo.";

    return new Response(JSON.stringify({ resposta: respostaTexto }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Erro interno no Edge Runtime:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}