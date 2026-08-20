import https from 'https';

// Função auxiliar blindada para fazer requisições à Pluggy
function fetchHttps(urlStr, options = {}, bodyData = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const reqOptions = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`Status ${res.statusCode}: ${JSON.stringify(parsed)}`));
                    }
                } catch (e) {
                    reject(new Error(`Falha ao ler JSON da resposta. Status: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (e) => reject(new Error(`Erro de conexão HTTPS: ${e.message}`)));

        if (bodyData) {
            req.write(JSON.stringify(bodyData));
        }
        req.end();
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { itemId } = req.body;
        if (!itemId) {
            return res.status(400).json({ error: 'itemId é obrigatório' });
        }

        const clientId = process.env.PLUGGY_CLIENT_ID;
        const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error("Variáveis PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET ausentes no .env");
        }

        console.log("1. Iniciando autenticação na Pluggy...");
        const authData = await fetchHttps('https://api.pluggy.ai/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        }, { clientId, clientSecret });

        const apiKey = authData.apiKey;
        if (!apiKey) throw new Error("API Key não retornada.");

        console.log("2. Autenticação concluída! Buscando contas do banco...");
        
        const accountsData = await fetchHttps(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
            method: 'GET',
            headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' }
        });

        if (!accountsData.results || accountsData.results.length === 0) {
            throw new Error("Nenhuma conta encontrada neste banco.");
        }

        console.log(`3. Encontrada(s) ${accountsData.results.length} conta(s). Buscando transações na V2...`);
        let allTransactions = [];

        // PASSO FINAL: Buscar transações na NOVA ROTA V2 da Pluggy
        for (const account of accountsData.results) {
            // A ÚNICA MUDANÇA ESTÁ AQUI: api.pluggy.ai/v2/transactions
            const transactionsData = await fetchHttps(`https://api.pluggy.ai/v2/transactions?accountId=${account.id}`, {
                method: 'GET',
                headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' }
            });
            
            if (transactionsData.results) {
                allTransactions = allTransactions.concat(transactionsData.results);
            }
        }

        console.log(`Sucesso! ${allTransactions.length} transações recuperadas.`);
        
        return res.status(200).json({ results: allTransactions });

    } catch (error) {
        console.error("Erro na importação:", error.message);
        return res.status(500).json({ error: error.message });
    }
}