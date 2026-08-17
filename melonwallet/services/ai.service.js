import { chamarGemini } from '../adapters/ai/gemini.adapter.js';

export async function categorizarGasto(nome) {
    const prompt = `
Classifique o estabelecimento/gasto abaixo em apenas UMA categoria fixa.
Responda APENAS com o nome da categoria, sem explicações, sem pontuação.

Categorias válidas: Alimentação, Transporte, Saúde, Educação, Lazer, Moradia, Serviços, Outros.

Estabelecimento: ${nome}
`;

    try {
        const categoria = await chamarGemini(prompt);
        const categoriasValidas = ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Moradia', 'Serviços', 'Outros'];
        const normalizada = categoriasValidas.find(c => categoria.toLowerCase().includes(c.toLowerCase()));
        return normalizada || 'Outros';
    } catch (error) {
        console.error('Erro ao categorizar gasto:', error);
        return 'Outros';
    }
}

export async function consultarAssistente(dadosSimulacoes, pergunta) {
    const prompt = `
Você é um assistente financeiro do Melon Wallet. Seja conciso e objetivo.

Dados das simulações do usuário (JSON resumido):
${JSON.stringify(dadosSimulacoes, null, 2)}

Pergunta: ${pergunta}

Responda em português, de forma direta e útil.
`;

    try {
        return await chamarGemini(prompt);
    } catch (error) {
        console.error('Erro ao consultar assistente:', error);
        return 'Desculpe, não consegui processar sua pergunta no momento. Tente novamente mais tarde.';
    }
}
