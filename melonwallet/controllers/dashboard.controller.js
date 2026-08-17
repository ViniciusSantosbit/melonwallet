import '../config/supabase.js';
import { registerChartPlugins } from '../charts/chart-registry.js';
import { renderBarChart } from '../charts/bar-chart.js';
import { renderPieChart } from '../charts/pie-chart.js';
import { hideLoader } from '../components/loader.component.js';
import { abrirModal, fecharModal } from '../components/modal.component.js';
import {
    alternarVisualizacaoSaldo,
    populateMonthSelector,
    setCurrentDate,
    setDefaultMonthInput,
    setGreeting,
    updateMetrics,
} from '../components/metrics.component.js';
import { renderGoalProgress, renderTopExpenses } from '../components/goals.component.js';
import { renderSimulacoesTable } from '../components/table.component.js';
import { criarSimulacao, deletarSimulacao, listarSimulacoes } from '../services/simulacoes.service.js';
import { escanearComprovante } from '../services/ocr.service.js';
import { categorizarGasto } from '../services/ai.service.js';
import { initChatWidget } from '../components/chat.component.js';
import { getUserId, getUserName } from '../storage/session.storage.js';
import { getMetaInvestimento, setMetaInvestimento } from '../storage/meta.storage.js';
import { logout, requireAuth } from '../services/session.service.js';
import {
    aggregateExpensesByName,
    aggregatePieChartData,
    computeBalances,
    computeGoalProgress,
    computeTotalInvestments,
    getTopExpenses,
} from '../utils/finance.util.js';
import { getCurrentMonthInput, getLongDateString } from '../utils/dates.util.js';
import { registerServiceWorker } from '../pwa/register-sw.js';

registerChartPlugins();

let todasSimulacoes = [];
window.todasSimulacoes = todasSimulacoes;
let metaValor = getMetaInvestimento();

function atualizarInsightsEMetas(mesSel) {
    metaValor = getMetaInvestimento();

    const gastos = aggregateExpensesByName(todasSimulacoes, mesSel);
    const investTotal = computeTotalInvestments(todasSimulacoes);
    const progresso = computeGoalProgress(investTotal, metaValor);
    const topGastos = getTopExpenses(gastos);

    renderGoalProgress({ progresso, investTotal, metaValor });
    renderTopExpenses(topGastos);
}

function atualizarPizzaPorMes(mes) {
    const { labels, valores } = aggregatePieChartData(todasSimulacoes, mes);
    renderPieChart(labels, valores);
}

async function carregarDados() {
    const userId = getUserId();
    const { data: sims, error } = await listarSimulacoes(userId);

    if (error) return;

    todasSimulacoes = sims;
    window.todasSimulacoes = todasSimulacoes;

    const balances = computeBalances(sims);

    updateMetrics({
        saldoGlobal: balances.saldoTotal,
        saldoMesAtual: balances.saldoMesAtual,
        tendencia: balances.tendenciaCalculada,
        corTendencia: balances.corTendenciaCalculada,
        totalSimulacoes: sims.length,
        lucroPrevisto: balances.saldoTotal * 0.01,
    });

    const seletor = populateMonthSelector(balances.mesesComDados);

    if (balances.mesesComDados.length > 0) {
        const ultimo = balances.mesesComDados[balances.mesesComDados.length - 1];
        seletor.value = ultimo;
        atualizarPizzaPorMes(ultimo);
        atualizarInsightsEMetas(ultimo);
    }

    renderBarChart(balances.mesesComDados, sims);
    renderSimulacoesTable(sims, handleDeleteSimulacao);
}

async function handleDeleteSimulacao(id) {
    if (!confirm('Excluir registro?')) return;
    await deletarSimulacao(id);
    await carregarDados();
}

function editarMeta() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:9999;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:#1c1c1e;padding:20px;border-radius:12px;color:#fff;display:flex;flex-direction:column;gap:10px;min-width:260px;';

    const input = document.createElement('input');
    input.type = 'number';
    input.value = metaValor;
    input.placeholder = 'Nova meta de investimento (R$)';
    input.style.cssText = 'padding:10px;border-radius:8px;border:1px solid #333;background:#2c2c2e;color:#fff;font-size:16px;';

    const btnConfirmar = document.createElement('button');
    btnConfirmar.textContent = 'Salvar';
    btnConfirmar.style.cssText = 'padding:10px;border-radius:8px;border:none;background:#32D74B;color:#000;font-weight:bold;cursor:pointer;';

    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px;border-radius:8px;border:none;background:#FF453A;color:#fff;cursor:pointer;';

    modal.appendChild(input);
    modal.appendChild(btnConfirmar);
    modal.appendChild(btnCancelar);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    input.focus();

    function fecharPromptMeta() {
        document.body.removeChild(overlay);
    }

    btnConfirmar.addEventListener('click', () => {
        const novoValor = parseFloat(input.value);
        if (novoValor && !isNaN(novoValor)) {
            metaValor = novoValor;
            setMetaInvestimento(metaValor);
            const seletor = document.getElementById('filtro-mes-pizza');
            atualizarInsightsEMetas(seletor.value || '');
        }
        fecharPromptMeta();
    });

    btnCancelar.addEventListener('click', fecharPromptMeta);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnConfirmar.click();
        if (e.key === 'Escape') btnCancelar.click();
    });
}

async function abrirSeletorOCR() {
    const input = document.getElementById('ocr-file-input');
    if (!input) return;

    input.value = '';
    input.click();
}

function initOcrFileHandler() {
    const input = document.getElementById('ocr-file-input');
    if (!input) return;

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const dados = await escanearComprovante(file);

            const categoria = await categorizarGasto(dados.merchant_name || 'Estabelecimento Escaneado');

            const novaSimulacaoOCR = {
                user_id: getUserId(),
                nome: dados.merchant_name || 'Estabelecimento Escaneado',
                tipo: 'saida',
                valor: -Math.abs(parseFloat(dados.total_amount) || 0),
                mes_referencia: dados.date ? dados.date.substring(0, 7) + '-01' : new Date().toISOString().substring(0, 7) + '-01',
                categoria: categoria,
            };

            console.log("DADOS ENVIADOS PARA O BANCO:", novaSimulacaoOCR);

            const { error } = await criarSimulacao(novaSimulacaoOCR);

            if (error) {
                console.error("ERRO DO SUPABASE:", error);
                alert('Erro ao salvar no banco: ' + error.message);
                return;
            }

            await carregarDados();

            alert(
                `Comprovante escaneado e salvo com sucesso!\n\n` +
                `Estabelecimento: ${novaSimulacaoOCR.nome}\n` +
                `Categoria: ${categoria}\n` +
                `Data: ${dados.date || 'N/A'}\n` +
                `Valor: R$ ${novaSimulacaoOCR.valor.toFixed(2)}`
            );
        } catch (error) {
            console.error("ERRO NO TRY/CATCH:", error);
            alert('Erro ao escanear: ' + error.message);
        }
    });
}

function initSimulacaoForm() {
    const formSim = document.getElementById('formSimulacao');
    if (!formSim) return;

    formSim.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('sim-nome').value;
        const categoria = await categorizarGasto(nome || 'Outros');

        const novaSim = {
            user_id: getUserId(),
            nome: nome,
            tipo: document.getElementById('sim-tipo').value,
            valor: parseFloat(document.getElementById('sim-valor').value),
            mes_referencia: document.getElementById('sim-mes').value + '-01',
            categoria: categoria,
        };

        const { error } = await criarSimulacao(novaSim);

        if (error) {
            alert('Erro ao salvar: ' + error.message);
        } else {
            fecharModal();
            formSim.reset();
            await carregarDados();
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    setGreeting(getUserName());
    setCurrentDate(getLongDateString());
    setDefaultMonthInput(getCurrentMonthInput());

    const seletor = document.getElementById('filtro-mes-pizza');
    if (seletor) {
        seletor.addEventListener('change', (e) => {
            atualizarPizzaPorMes(e.target.value);
            atualizarInsightsEMetas(e.target.value);
        });
    }

    initSimulacaoForm();
    initOcrFileHandler();
    initChatWidget();
    await carregarDados();
    hideLoader();
});

registerServiceWorker('[PWA] SW ativo no dashboard:');

window.logout = logout;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.alternarVisualizacaoSaldo = alternarVisualizacaoSaldo;
window.editarMeta = editarMeta;
window.deletarSimulacao = handleDeleteSimulacao;
window.abrirSeletorOCR = abrirSeletorOCR;