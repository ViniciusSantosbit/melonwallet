export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // 1. Verifica se é uma requisição POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // 2. Recebe a imagem (apenas para validar que o upload funcionou)
        const formData = await req.formData();
        const file = formData.get('document');

        if (!file) {
            return new Response(JSON.stringify({ error: 'Nenhum documento enviado' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 3. O TRUQUE: Simula o tempo de processamento de uma IA (1.5 segundos)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 4. Retorna os dados simulados no formato exato que o seu frontend espera
        return new Response(JSON.stringify({
            merchant_name: "Mercado Simulação (Mock)",
            date: new Date().toISOString().split('T')[0], // Retorna a data de hoje
            total_amount: 149.90, // O valor simulado que vai para o app
            confidence: 0.99,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}