import { getMonthLabel, getCurrentMonthLabel, getPreviousMonthLabel } from './dates.util.js';
import { SIMULACAO_TIPOS } from '../config/constants.js';

function aplicarValorAoSaldo(saldo, simulacao) {
    const valor = parseFloat(simulacao.valor);
    if (simulacao.tipo === SIMULACAO_TIPOS.SAIDA) return saldo - valor;
    return saldo + valor;
}

export function computeBalances(simulacoes) {
    let saldoTotal = 0;
    let saldoMesAtual = 0;
    let saldoAnt = 0;
    const mesesComDados = new Set();

    const labelMesAtual = getCurrentMonthLabel();
    const labelAnt = getPreviousMonthLabel();

    simulacoes.forEach((s) => {
        const label = getMonthLabel(s.mes_referencia);
        saldoTotal = aplicarValorAoSaldo(saldoTotal, s);

        if (label === labelMesAtual) {
            saldoMesAtual = aplicarValorAoSaldo(saldoMesAtual, s);
        }
        if (label === labelAnt) {
            saldoAnt = aplicarValorAoSaldo(saldoAnt, s);
        }
        mesesComDados.add(label);
    });

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
        mesesComDados: Array.from(mesesComDados),
        tendenciaCalculada,
        corTendenciaCalculada,
    };
}

export function aggregateExpensesByName(simulacoes, mesSel) {
    const gastos = {};

    simulacoes.forEach((s) => {
        const label = getMonthLabel(s.mes_referencia);
        if (label === mesSel && s.tipo === SIMULACAO_TIPOS.SAIDA) {
            gastos[s.nome] = (gastos[s.nome] || 0) + parseFloat(s.valor);
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
        if (label === mes && s.tipo === SIMULACAO_TIPOS.SAIDA) {
            categorias[s.nome] = (categorias[s.nome] || 0) + parseFloat(s.valor);
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

        if (s.tipo === SIMULACAO_TIPOS.SAIDA) {
            saidas[index] += parseFloat(s.valor) * -1;
        } else {
            entradas[index] += parseFloat(s.valor);
        }
    });

    return { entradas, saidas };
}
