import { listar as adapterListar, criar as adapterCriar, deletar as adapterDeletar, criarMultiplos as adapterCriarMultiplos } from '../adapters/supabase/transaction.adapter.js';
import { getUserId } from '../storage/session.storage.js';
import { listarContas as adapterListarContas, criarConta as adapterCriarConta } from '../adapters/supabase/contas.adapter.js';
import { SIMULACAO_TIPOS } from '../config/constants.js';
import { getCurrentMonthInput } from '../utils/dates.util.js';

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

    return adapterCriar(transacaoComConta);
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
        data_transacao: dataTransacaoOriginal,
    };
}

export async function importarTransacoesPluggy(transacoesPluggy) {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuário não autenticado');
    }

    const contaId = await obterContaIdPadrao(userId);
    const normalizadas = transacoesPluggy.map((t) => normalizarTransacaoPluggy(t, userId, contaId));

    console.log('Dados normalizados para o Supabase (bulk insert):', JSON.stringify(normalizadas, null, 2));
    console.log('Total de transações a inserir:', normalizadas.length);
    console.log('Mês atual do sistema (getCurrentMonthInput):', getCurrentMonthInput());

    console.log("Preparando para inserir", normalizadas.length, "transações no Supabase...");

    try {
        const resultado = await adapterCriarMultiplos(normalizadas);
        console.log('Transações inseridas no banco com sucesso!');
        console.log('Resultado do INSERT no Supabase:', resultado);

        return resultado;
    } catch (error) {
        console.error("Erro fatal ao salvar no Supabase:", error);
        throw error;
    }
}