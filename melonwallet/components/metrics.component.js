import { formatBRL } from '../utils/format.util.js';

export function updateMetrics({
    saldoGlobal,
    saldoMesAtual,
    tendencia,
    corTendencia,
    totalSimulacoes,
    lucroPrevisto,
}) {
    const saldoGlobalCalculado = saldoGlobal;
    const saldoMesAtualCalculado = saldoMesAtual;
    const tendenciaCalculada = tendencia;
    const corTendenciaCalculada = corTendencia;

    window.__melonMetrics = {
        saldoGlobalCalculado,
        saldoMesAtualCalculado,
        tendenciaCalculada,
        corTendenciaCalculada,
    };

    document.getElementById('total-lucro').innerText = `R$ ${formatBRL(lucroPrevisto)}`;
    document.getElementById('total-ativos').innerText = totalSimulacoes;

    alternarVisualizacaoSaldo();
}

export function alternarVisualizacaoSaldo() {
    const metrics = window.__melonMetrics || {};
    const tipo = document.getElementById('seletor-tipo-saldo').value;
    const campoSaldo = document.getElementById('total-saldo');
    const campoTrend = document.getElementById('tendencia-container');

    if (tipo === 'mes') {
        campoSaldo.innerText = `R$ ${formatBRL(metrics.saldoMesAtualCalculado || 0)}`;
        campoTrend.style.opacity = '0';
    } else {
        campoSaldo.innerText = `R$ ${formatBRL(metrics.saldoGlobalCalculado || 0)}`;
        campoTrend.innerText = metrics.tendenciaCalculada || '';
        campoTrend.style.color = metrics.corTendenciaCalculada || '';
        campoTrend.style.opacity = '1';
    }
}

export function populateMonthSelector(meses) {
    const seletor = document.getElementById('filtro-mes-pizza');
    seletor.innerHTML = '';

    meses.forEach((mes) => {
        const opt = document.createElement('option');
        opt.value = mes;
        opt.innerText = mes;
        seletor.appendChild(opt);
    });

    return seletor;
}

export function setGreeting(nome) {
    const greeting = document.getElementById('user-greeting');
    if (greeting) greeting.innerText = `Olá, ${nome}`;
}

export function setCurrentDate(texto) {
    const dateElement = document.getElementById('current-date');
    if (dateElement) dateElement.innerText = texto;
}

export function setDefaultMonthInput(valor) {
    const inputMes = document.getElementById('sim-mes');
    if (inputMes) inputMes.value = valor;
}
