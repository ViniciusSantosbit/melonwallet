import { getMonthLabel, getPreviousMonthLabel } from './dates.util.js';
import { SIMULACAO_TIPOS } from '/config/constants.js';

function cleanNome(nome) {
    if (!nome) return '';
    let limpo = nome;
    if (limpo.includes('|')) {
        limpo = limpo.split('|').pop().trim();
    }
    limpo = limpo
        .replace(/Compra no débito/gi, '')
        .replace(/Transferência enviada/gi, '')
        .replace(/Transferência Recebida/gi, '')
        .replace(/Pelo Pix/gi, '')
        .replace(/Pix/gi, '')
        .trim();

    if (limpo.length > 0) {
        limpo = limpo.charAt(0).toUpperCase() + limpo.slice(1);
    }

    return limpo || 'Outros';
}

function aplicarValorAoSaldo(saldo, simulacao) {
    const valor = parseFloat(simulacao.valor);
    const isSaida = simulacao.tipo === SIMULACAO_TIPOS.SAIDA || simulacao.tipo === 'saida';
    if (isSaida) return saldo - Math.abs(valor);
    return saldo + Math.abs(valor);
}

export function computeBalances(simulacoes) {
    let saldoTotal = 0;
    let saldoMesAtual = 0;
    let saldoAnt = 0;
    const mesesReferencia = new Set();

    const labelAnt = getPreviousMonthLabel();

    simulacoes.forEach((s) => {
        const label = getMonthLabel(s.mes_referencia);
        saldoTotal = aplicarValorAoSaldo(saldoTotal, s);

        const partes = String(s.mes_referencia).split('-');
        const mesTx = parseInt(partes[1], 10) - 1;
        const anoTx = parseInt(partes[0], 10);
        const hoje = new Date();
        if (mesTx === hoje.getMonth() && anoTx === hoje.getFullYear()) {
            saldoMesAtual = aplicarValorAoSaldo(saldoMesAtual, s);
        }

        if (label === labelAnt) {
            saldoAnt = aplicarValorAoSaldo(saldoAnt, s);
        }
        mesesReferencia.add(s.mes_referencia);
    });

    const mesesComDados = Array.from(mesesReferencia)
        .sort((a, b) => a.localeCompare(b))
        .map((m) => getMonthLabel(m));

    let tendenciaCalculada = '';
    let corTendenciaCalculada = '';

    if (saldoAnt !== 0) {
        const perc = ((saldoTotal - saldoAnt) / Math.abs(saldoAnt)) * 100;
        tendenciaCalculada = `${perc >= 0 ? '↑' : '↓'} ${Math.abs(perc).toFixed(1)}% vs mês passado`;
        corTendenciaCalculada = perc >= 0 ? '#32D74B' : '#FF453A';
    }

    return {
        saldoTotal,
        saldoMesAtual,
        saldoAnt,
        mesesComDados,
        tendenciaCalculada,
        corTendenciaCalculada,
    };
}

export function aggregateExpensesByName(simulacoes, mesSel) {
    const gastos = {};

    simulacoes.forEach((s) => {
        const label = getMonthLabel(s.mes_referencia);
        const isSaida = s.tipo === SIMULACAO_TIPOS.SAIDA || s.tipo === 'saida';
        if (label === mesSel && isSaida) {
            const nomeLimpo = cleanNome(s.nome);
            gastos[nomeLimpo] = (gastos[nomeLimpo] || 0) + Math.abs(parseFloat(s.valor));
        }
    });

    return gastos;
}

export function computeTotalInvestments(simulacoes) {
    return simulacoes
        .filter((s) => s.tipo === SIMULACAO_TIPOS.INVESTIMENTO)
        .reduce((total, s) => total + parseFloat(s.valor), 0);
}

export function getTopExpenses(gastos, limit = 3) {
    return Object.entries(gastos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
}

export function computeGoalProgress(investTotal, metaValor) {
    return Math.min((investTotal / metaValor) * 100, 100);
}

export function aggregatePieChartData(simulacoes, mes) {
    const categorias = {};

    simulacoes.forEach((s) => {
        const label = getMonthLabel(s.mes_referencia);
        const isSaida = s.tipo === SIMULACAO_TIPOS.SAIDA || s.tipo === 'saida';
        if (label === mes && isSaida) {
            const nomeLimpo = cleanNome(s.nome);
            categorias[nomeLimpo] = (categorias[nomeLimpo] || 0) + Math.abs(parseFloat(s.valor));
        }
    });

    return {
        labels: Object.keys(categorias),
        valores: Object.values(categorias),
    };
}

export function buildBarChartData(labels, simulacoes) {
    const entradas = Array(labels.length).fill(0);
    const saidas = Array(labels.length).fill(0);

    simulacoes.forEach((s) => {
        const index = labels.indexOf(getMonthLabel(s.mes_referencia));
        if (index === -1) return;

        const isSaida = s.tipo === SIMULACAO_TIPOS.SAIDA || s.tipo === 'saida';
        const valor = parseFloat(s.valor);
        if (isSaida) {
            saidas[index] += -Math.abs(valor);
        } else {
            entradas[index] += Math.abs(valor);
        }
    });

    return { entradas, saidas };
}
