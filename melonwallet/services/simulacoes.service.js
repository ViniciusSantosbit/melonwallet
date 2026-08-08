import { listar as adapterListar, criar as adapterCriar, deletar as adapterDeletar } from '../adapters/supabase/transaction.adapter.js';
import { getUserId } from '../storage/session.storage.js';
import { listarContas as adapterListarContas, criarConta as adapterCriarConta } from '../adapters/supabase/contas.adapter.js';

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