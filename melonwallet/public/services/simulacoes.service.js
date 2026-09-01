import { listar as adapterListar, criar as adapterCriar, deletar as adapterDeletar, criarMultiplos as adapterCriarMultiplos } from '/adapters/supabase/transaction.adapter.js';
import { getUserId } from '/storage/session.storage.js';
import { listarContas as adapterListarContas, criarConta as adapterCriarConta } from '/adapters/supabase/contas.adapter.js';
import { SIMULACAO_TIPOS } from '/config/constants.js';
import { getCurrentMonthInput } from '/utils/dates.util.js';

export async function listarSimulacoes(userId) {
    return adapterListar(userId);
}

async function obterContaIdPadrao(userId) {
    const { data: contas, error } = await adapterListarContas(userId);
    if (error) throw error;

    if (contas && contas.length > 0) {
        return contas[0].id;
    }

    const { data: novaConta, error: createError } = await adapterCriarConta({
        user_id: userId,
        nome: 'Carteira Principal',
        tipo: 'carteira',
        saldo_inicial: 0,
        is_ativa: true,
    });

    if (createError) throw createError;
    if (!novaConta || novaConta.length === 0) throw new Error('Erro ao criar conta padrão');

    return novaConta[0].id;
}

export async function criarSimulacao(simulacao) {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuário não autenticado');
    }

    const contaId = await obterContaIdPadrao(userId);

    const transacaoComConta = {
        ...simulacao,
        user_id: userId,
        conta_id: contaId,
    };

    console.log('[Simulação] Salvando:', JSON.stringify(transacaoComConta, null, 2));

    const resultado = await adapterCriar(transacaoComConta);

    if (resultado.error) {
        console.error('[Simulação] Erro do Supabase:', resultado.error);
        throw new Error(resultado.error.message || 'Erro ao salvar simulação');
    }

    return resultado;
}

export async function deletarSimulacao(id) {
    return adapterDeletar(id);
}

function normalizarTransacaoPluggy(transacao, userId, contaId) {
    const amount = parseFloat(transacao.amount);
    const tipo = amount < 0 ? SIMULACAO_TIPOS.SAIDA : SIMULACAO_TIPOS.ENTRADA;
    const valor = amount;

    let mesReferencia = getCurrentMonthInput() + '-01';
    const dataTransacaoOriginal = transacao.date || transacao.createdAt || new Date().toISOString();
    if (dataTransacaoOriginal) {
        const parts = String(dataTransacaoOriginal).split('-');
        const ano = parseInt(parts[0], 10);
        const mes = parseInt(parts[1], 10);
        mesReferencia = `${ano}-${String(mes).padStart(2, '0')}-01`;
    }

    let categoria = 'Outros';
    if (transacao.category) {
        if (typeof transacao.category === 'string') {
            categoria = transacao.category;
        } else if (transacao.category.name) {
            categoria = transacao.category.name;
        }
    }

    let nomeLimpo = transacao.description || 'Transação Pluggy';
    if (nomeLimpo.includes('|')) {
        nomeLimpo = nomeLimpo.split('|').pop().trim();
    }
    nomeLimpo = nomeLimpo
        .replace(/Compra no débito/gi, '')
        .replace(/Transferência enviada/gi, '')
        .replace(/Transferência Recebida/gi, '')
        .trim();

    if (nomeLimpo.length > 0) {
        nomeLimpo = nomeLimpo.charAt(0).toUpperCase() + nomeLimpo.slice(1);
    }

    if (!categoria || categoria === 'Outros') {
        categoria = nomeLimpo || 'Outros';
    }

    return {
        user_id: userId,
        nome: nomeLimpo || 'Transação Pluggy',
        tipo,
        valor,
        mes_referencia: mesReferencia,
        categoria,
        conta_id: contaId,
        origem: 'open_finance',
    };
}

function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export async function importarTransacoesPluggy(transacoesPluggy) {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuário não autenticado');
    }

    const contaId = await obterContaIdPadrao(userId);
    const normalizadas = transacoesPluggy.map((t) => normalizarTransacaoPluggy(t, userId, contaId));

    console.log('Total de transações a inserir:', normalizadas.length);

    const BATCH_SIZE = 100;
    const lotes = chunkArray(normalizadas, BATCH_SIZE);
    console.log(`Divididos em ${lotes.length} lotes de até ${BATCH_SIZE} transações`);

    let totalInseridos = 0;

    for (let i = 0; i < lotes.length; i++) {
        const lote = lotes[i];
        console.log(`Inserindo lote ${i + 1}/${lotes.length} (${lote.length} transações)...`);

        try {
            const resultado = await adapterCriarMultiplos(lote);

            if (resultado.error) {
                console.error(`[Erro no lote ${i + 1}] Supabase retornou erro:`, resultado.error);
                throw new Error(`Erro no lote ${i + 1}: ${resultado.error.message}`);
            }

            totalInseridos += lote.length;
            console.log(`Lote ${i + 1}/${lotes.length} inserido com sucesso (${lote.length} transações)`);
        } catch (error) {
            console.error(`[Erro fatal no lote ${i + 1}]`, error.message);
            throw error;
        }
    }

    console.log(`Transações inseridas no banco com sucesso! Total: ${totalInseridos}/${normalizadas.length}`);
    return { totalInseridos, totalEsperado: normalizadas.length };
}