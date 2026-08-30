import '/config/supabase.js';
import { registerChartPlugins } from '/charts/chart-registry.js';
import { renderBarChart } from '/charts/bar-chart.js';
import { renderPieChart } from '/charts/pie-chart.js';
import { hideLoader } from '/components/loader.component.js';
import { abrirModal, fecharModal } from '/components/modal.component.js';
import { showMelonConfirm, showMelonAlert } from '/utils/modal.util.js';
import {
    alternarVisualizacaoSaldo,
    populateMonthSelector,
    setCurrentDate,
    setDefaultMonthInput,
    setGreeting,
    updateMetrics,
} from '/components/metrics.component.js';
import { renderGoalProgress, renderTopExpenses } from '/components/goals.component.js';
import { renderSimulacoesTable } from '/components/table.component.js';
import { criarSimulacao, deletarSimulacao, listarSimulacoes } from '/services/simulacoes.service.js';
import { escanearComprovante } from '/services/ocr.service.js';
import { categorizarGasto } from '/services/ai.service.js';
import { initPluggySyncButton, sincronizarBanco } from '/adapters/open-finance/pluggy.adapter.js';
import { initChatWidget } from '/components/chat.component.js';
import { getUserId, getUserName } from '/storage/session.storage.js';
import { getMetaInvestimento, setMetaInvestimento } from '/storage/meta.storage.js';
import { logout, requireAuth } from '/services/session.service.js';
import {
    aggregateExpensesByName,
    aggregatePieChartData,
    computeBalances,
    computeGoalProgress,
    computeTotalInvestments,
    getTopExpenses,
} from '/utils/finance.util.js';
import { getCurrentMonthInput, getLongDateString, getMonthLabel } from '/utils/dates.util.js';
import { registerServiceWorker } from '/pwa/register-sw.js';

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

function atualizarTabelaPorMes(mesSel) {
    let transacoesFiltradas = todasSimulacoes;
    if (mesSel) {
        transacoesFiltradas = todasSimulacoes.filter((s) => getMonthLabel(s.mes_referencia) === mesSel);
    }

    const transacoesOrdenadas = [...transacoesFiltradas].sort((a, b) => {
        const dataA = new Date(a.created_at || a.data || a.data_efetivacao || a.mes_referencia || 0);
        const dataB = new Date(b.created_at || b.data || b.data_efetivacao || b.mes_referencia || 0);
        return dataB - dataA;
    }).slice(0, 8);

    renderSimulacoesTable(transacoesOrdenadas, handleDeleteSimulacao);
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
    let mesInicial = '';

    if (balances.mesesComDados.length > 0) {
        mesInicial = balances.mesesComDados[balances.mesesComDados.length - 1];
        seletor.value = mesInicial;
        atualizarPizzaPorMes(mesInicial);
        atualizarInsightsEMetas(mesInicial);
    }

    renderBarChart(balances.mesesComDados, sims);

    setTimeout(() => {
        const container = document.querySelector('.chart-container-scroll');
        if (container) {
            container.scrollLeft = container.scrollWidth;
        }
    }, 50);

    atualizarTabelaPorMes(mesInicial);

    const bankStatus = document.getElementById('bank-status');
    const btnSyncBank = document.getElementById('btn-sync-bank');
    const bankStatusWrapper = document.getElementById('bank-status-wrapper');

    if (bankStatus && btnSyncBank && bankStatusWrapper) {
        if (sims.length > 0) {
            btnSyncBank.classList.add('hidden');
            bankStatusWrapper.classList.remove('hidden');
            bankStatus.style.display = 'inline-flex';
            requestAnimationFrame(() => bankStatus.classList.add('visible'));
        } else {
            btnSyncBank.classList.remove('hidden');
            bankStatusWrapper.classList.add('hidden');
            bankStatus.classList.remove('visible');
            setTimeout(() => { bankStatus.style.display = 'none'; }, 400);
        }
    }
}

// Re-renderiza o dashboard inteiro a partir do array em memória (sem chamar o banco).
// Usado na UI otimista para a tela reagir na mesma fração de segundo.
function atualizarDashboard() {
    const sims = todasSimulacoes;
    const balances = computeBalances(sims);

    updateMetrics({
        saldoGlobal: balances.saldoTotal,
        saldoMesAtual: balances.saldoMesAtual,
        tendencia: balances.tendenciaCalculada,
        corTendencia: balances.corTendenciaCalculada,
        totalSimulacoes: sims.length,
        lucroPrevisto: balances.saldoTotal * 0.01,
    });

    const seletorAnterior = document.getElementById('filtro-mes-pizza')?.value || '';
    const seletor = populateMonthSelector(balances.mesesComDados);

    let mesSelecionado = seletorAnterior;
    if (!balances.mesesComDados.includes(mesSelecionado)) {
        mesSelecionado = balances.mesesComDados.length > 0 ? balances.mesesComDados[balances.mesesComDados.length - 1] : '';
    }
    seletor.value = mesSelecionado;

    if (balances.mesesComDados.length > 0) {
        atualizarPizzaPorMes(mesSelecionado);
        atualizarInsightsEMetas(mesSelecionado);
    }

    renderBarChart(balances.mesesComDados, sims);

    setTimeout(() => {
        const container = document.querySelector('.chart-container-scroll');
        if (container) {
            container.scrollLeft = container.scrollWidth;
        }
    }, 50);

    atualizarTabelaPorMes(mesSelecionado);
}

async function handleDeleteSimulacao(id) {
    const confirmado = await showMelonConfirm('Tem certeza que deseja excluir este registro?', {
        type: 'confirm',
        icon: '🗑️',
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
        danger: true,
    });

    if (!confirmado) return;
    await deletarSimulacao(id);
    await carregarDados();
}

function editarMeta() {
    const overlay = document.createElement('div');
    overlay.className = 'meta-modal-overlay';

    const card = document.createElement('div');
    card.className = 'meta-modal-card';

    const title = document.createElement('h3');
    title.textContent = 'Alterar Meta de Investimento';

    const input = document.createElement('input');
    input.type = 'number';
    input.value = metaValor;
    input.placeholder = 'Nova meta de investimento (R$)';

    const actions = document.createElement('div');
    actions.className = 'meta-modal-actions';

    const btnConfirm = document.createElement('button');
    btnConfirm.className = 'btn-confirm';
    btnConfirm.textContent = 'Salvar';

    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn-cancel';
    btnCancel.textContent = 'Cancelar';

    actions.appendChild(btnConfirm);
    actions.appendChild(btnCancel);
    card.appendChild(title);
    card.appendChild(input);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('open'));
    input.focus();

    function fecharPromptMeta() {
        overlay.classList.remove('open');
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 250);
    }

    btnConfirm.addEventListener('click', () => {
        const novoValor = parseFloat(input.value);
        if (novoValor && !isNaN(novoValor)) {
            metaValor = novoValor;
            setMetaInvestimento(metaValor);
            const seletor = document.getElementById('filtro-mes-pizza');
            atualizarInsightsEMetas(seletor.value || '');
        }
        fecharPromptMeta();
    });

    btnCancel.addEventListener('click', fecharPromptMeta);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnConfirm.click();
        if (e.key === 'Escape') btnCancel.click();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fecharPromptMeta();
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
                await showMelonAlert('Erro ao salvar no banco: ' + error.message, { type: 'error' });
                return;
            }

            await carregarDados();

            await showMelonAlert(
                `Comprovante escaneado e salvo com sucesso!\n\n` +
                `Estabelecimento: ${novaSimulacaoOCR.nome}\n` +
                `Categoria: ${categoria}\n` +
                `Data: ${dados.date || 'N/A'}\n` +
                `Valor: R$ ${novaSimulacaoOCR.valor.toFixed(2)}`,
                { type: 'success' }
            );
        } catch (error) {
            console.error("ERRO NO TRY/CATCH:", error);
            await showMelonAlert('Erro ao escanear: ' + error.message, { type: 'error' });
        }
    });
}

function initSimulacaoForm() {
    const formSim = document.getElementById('formSimulacao');
    if (!formSim) return;

    formSim.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('sim-nome').value;

        // 1. Monta o objeto bruto do formulário
        const novaTransacao = {
            descricao: nome,
            tipo: document.getElementById('sim-tipo').value,
            valor: parseFloat(document.getElementById('sim-valor').value),
            data: document.getElementById('dataSimulacao').value,
            categoria: 'Outros',
        };

        // Payload com match exato nas colunas reais do Supabase
        const dataInsercao = new Date(novaTransacao.data);
        const mesReferenciaFormatado = `${dataInsercao.getFullYear()}-${String(dataInsercao.getMonth() + 1).padStart(2, '0')}-01`;

        const payload = {
            nome: novaTransacao.descricao,
            tipo: novaTransacao.tipo,
            valor: novaTransacao.valor,
            created_at: novaTransacao.data,
            mes_referencia: mesReferenciaFormatado,
            origem: 'manual',
            status: 'Ativo'
        };

        // 2. UI Otimista: insere no array local COM O MESMO FORMATO DO BANCO (evita undefined/Invalid Date)
        const transacaoOtimista = {
            id: 'temp-' + Date.now(),
            nome: payload.nome,
            tipo: payload.tipo,
            valor: payload.valor,
            created_at: payload.created_at,
            mes_referencia: payload.mes_referencia,
            origem: payload.origem,
            status: payload.status,
            categoria: novaTransacao.categoria,
        };

        todasSimulacoes.unshift(transacaoOtimista);
        window.todasSimulacoes = todasSimulacoes;
        atualizarDashboard();
        fecharModal();
        formSim.reset();

        // 3. Persistência no Supabase (após a UI já estar atualizada -> não trava a tela).
        //    O Supabase resolve a promise com { data, error } mesmo em erro de banco, por isso checamos o `error`.
        try {
            const categoria = await categorizarGasto(nome || 'Outros');
            transacaoOtimista.categoria = categoria;
            atualizarDashboard(); // reflete a categoria correta no gráfico de pizza/insights

            const { data, error } = await criarSimulacao(payload);

            if (error) {
                console.error('Erro do Supabase:', error);
                throw error;
            }

            // Reconcilia o id retornado para que a exclusão futura funcione
            const inserido = Array.isArray(data) && data[0] ? data[0] : null;
            if (inserido && inserido.id) transacaoOtimista.id = inserido.id;
        } catch (err) {
            console.error('Erro ao salvar simulação no banco:', err);
            await showMelonAlert('Erro ao salvar simulação no banco: ' + (err && err.message ? err.message : err), { type: 'error' });
            const idx = todasSimulacoes.indexOf(transacaoOtimista);
            if (idx > -1) todasSimulacoes.splice(idx, 1);
            window.todasSimulacoes = todasSimulacoes;
            atualizarDashboard();
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    initPluggySyncButton(carregarDados);

    const btnChangeBank = document.getElementById('btn-change-bank');
    if (btnChangeBank) {
        btnChangeBank.addEventListener('click', async () => {
            await sincronizarBanco(carregarDados);
        });
    }

    setGreeting(getUserName());
    setCurrentDate(getLongDateString());
    setDefaultMonthInput(getCurrentMonthInput());

    const seletor = document.getElementById('filtro-mes-pizza');
    if (seletor) {
        seletor.addEventListener('change', (e) => {
            atualizarPizzaPorMes(e.target.value);
            atualizarInsightsEMetas(e.target.value);
            atualizarTabelaPorMes(e.target.value);
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