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

    const regraDeNegocio = `
      Você é o assistente financeiro exclusivo do aplicativo Melon Wallet. 
      O Melon Wallet não processa transações monetárias reais; ele opera puramente como uma ferramenta de simulação, onde o usuário insere um valor manualmente e o sistema trabalha com esse montante para projetar lucros e perdas.
      
      SUA REGRA MÁXIMA: Você DEVE responder APENAS a perguntas sobre finanças, investimentos, simulações financeiras e sobre os dados da carteira do usuário. 
      Se o usuário perguntar sobre QUALQUER outro assunto (filmes, super-heróis, fofocas, receitas, programação, etc.), você está PROIBIDO de responder.
      Nesses casos de desvio de assunto, responda APENAS: "Desculpe, sou o assistente financeiro do Melon Wallet e fui programado para falar exclusivamente sobre suas finanças e simulações."
      
      Mensagem do usuário: "${prompt}"
    `;

    // Apontando direto para o modelo ultrarrápido, sem loops
    const model = 'gemini-3.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: regraDeNegocio }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro retornado pelo Google:", data);
      return new Response(JSON.stringify({ error: "Erro na API Gemini", detalhes: data }), { status: 502 });
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