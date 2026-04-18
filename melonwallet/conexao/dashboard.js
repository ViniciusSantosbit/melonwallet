// conexao/dashboard.js
Chart.register(ChartDataLabels);

let meuGraficoBarras = null;
let meuGraficoPizza = null;
let todasSimulacoes = []; 
let META_VALOR = parseFloat(localStorage.getItem('melon_meta_investimento')) || 10000;

// Variáveis para alternância de saldo
let saldoGlobalCalculado = 0;
let saldoMesAtualCalculado = 0;
let tendenciaCalculada = "";
let corTendenciaCalculada = "";

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('melon_user_id');
    if (!userId) { window.location.href = 'index.html'; return; }

    const greeting = document.getElementById('user-greeting');
    if (greeting) greeting.innerText = `Olá, ${localStorage.getItem('melon_user_nome')}`;

    const inputMes = document.getElementById('sim-mes');
    if(inputMes) inputMes.value = new Date().toISOString().substring(0, 7);

    const seletor = document.getElementById('filtro-mes-pizza');
    if(seletor) {
        seletor.addEventListener('change', (e) => {
            atualizarPizzaPorMes(e.target.value);
            atualizarInsightsEMetas(e.target.value);
        });
    }

    await carregarDados();
});

// --- CONTROLE DE INTERFACE ---
function abrirModal() { document.getElementById('modal-simulacao').style.display = 'flex'; }
function fecharModal() { document.getElementById('modal-simulacao').style.display = 'none'; }
function alternarVisualizacaoSaldo() {
    const tipo = document.getElementById('seletor-tipo-saldo').value;
    const campoSaldo = document.getElementById('total-saldo');
    const campoTrend = document.getElementById('tendencia-container');

    if (tipo === 'mes') {
        campoSaldo.innerText = `R$ ${saldoMesAtualCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        campoTrend.style.opacity = "0";
    } else {
        campoSaldo.innerText = `R$ ${saldoGlobalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        campoTrend.innerText = tendenciaCalculada;
        campoTrend.style.color = corTendenciaCalculada;
        campoTrend.style.opacity = "1";
    }
}

const formSim = document.getElementById('formSimulacao');
if (formSim) {
    formSim.addEventListener('submit', async (e) => {
        e.preventDefault();
        const novaSim = {
            user_id: localStorage.getItem('melon_user_id'),
            nome: document.getElementById('sim-nome').value,
            tipo: document.getElementById('sim-tipo').value,
            valor: parseFloat(document.getElementById('sim-valor').value),
            mes_referencia: document.getElementById('sim-mes').value + "-01"
        };
        const { error } = await _supabase.from('simulacoes').insert([novaSim]);
        if (error) alert("Erro: " + error.message);
        else { fecharModal(); formSim.reset(); await carregarDados(); }
    });
}

// --- CARREGAR DADOS ---
async function carregarDados() {
    const userId = localStorage.getItem('melon_user_id');
    const { data: sims, error } = await _supabase.from('simulacoes').select('*').eq('user_id', userId).order('mes_referencia', { ascending: true });

    if (error) return;
    todasSimulacoes = sims; 

    let saldoTotal = 0;
    let saldoMesAtual = 0;
    let saldoAnt = 0;
    const mesesComDados = new Set();
    const agora = new Date();
    const labelMesAtual = agora.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
    const dataAnt = new Date(); dataAnt.setMonth(agora.getMonth() - 1);
    const labelAnt = dataAnt.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });

    sims.forEach(s => {
        const v = parseFloat(s.valor);
        const l = new Date(s.mes_referencia).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        
        if (s.tipo === 'Saída') saldoTotal -= v; else saldoTotal += v;
        if (l === labelMesAtual) { if (s.tipo === 'Saída') saldoMesAtual -= v; else saldoMesAtual += v; }
        if (l === labelAnt) { if (s.tipo === 'Saída') saldoAnt -= v; else saldoAnt += v; }
        mesesComDados.add(l);
    });

    saldoGlobalCalculado = saldoTotal;
    saldoMesAtualCalculado = saldoMesAtual;

    if (saldoAnt !== 0) {
        const perc = ((saldoTotal - saldoAnt) / Math.abs(saldoAnt)) * 100;
        tendenciaCalculada = `${perc >= 0 ? '↑' : '↓'} ${Math.abs(perc).toFixed(1)}% vs mês passado`;
        corTendenciaCalculada = perc >= 0 ? '#32D74B' : '#FF453A';
    }

    alternarVisualizacaoSaldo(); // Exibe o saldo inicial
    document.getElementById('total-lucro').innerText = `R$ ${(saldoTotal * 0.01).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('total-ativos').innerText = sims.length;

    const seletor = document.getElementById('filtro-mes-pizza');
    seletor.innerHTML = "";
    const arrayMeses = Array.from(mesesComDados);
    arrayMeses.forEach(m => {
        const opt = document.createElement('option'); opt.value = m; opt.innerText = m;
        seletor.appendChild(opt);
    });

    if (arrayMeses.length > 0) {
        const ultimo = arrayMeses[arrayMeses.length - 1];
        seletor.value = ultimo;
        atualizarPizzaPorMes(ultimo);
        atualizarInsightsEMetas(ultimo);
    }

    renderizarGraficoBarras(arrayMeses, sims);
    preencherTabela(sims);
}

// --- METAS E INSIGHTS ---
function atualizarInsightsEMetas(mesSel) {
    const gastos = {};
    let investTotal = 0;

    todasSimulacoes.forEach(s => {
        const l = new Date(s.mes_referencia).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (s.tipo === 'Investimento') investTotal += parseFloat(s.valor);
        if (l === mesSel && s.tipo === 'Saída') {
            gastos[s.nome] = (gastos[s.nome] || 0) + parseFloat(s.valor);
        }
    });

    const prog = Math.min((investTotal / META_VALOR) * 100, 100);
    document.getElementById('goal-progress-bar').style.width = prog + '%';
    document.getElementById('goal-percent-text').innerText = Math.floor(prog) + '%';
    document.getElementById('goal-value-text').innerText = `R$ ${investTotal.toLocaleString('pt-BR')} / R$ ${META_VALOR.toLocaleString('pt-BR')}`;

    const top = Object.entries(gastos).sort((a,b) => b[1]-a[1]).slice(0,3);
    const container = document.getElementById('top-expenses-container');
    container.innerHTML = top.length ? "" : "<p style='color:#86868b'>Sem gastos.</p>";
    top.forEach(([n, v]) => {
        container.innerHTML += `<div class="expense-insight-card"><span>${n}</span><b>R$ ${v.toLocaleString('pt-BR')}</b></div>`;
    });
}

function atualizarPizzaPorMes(mes) {
    const cat = {};
    todasSimulacoes.forEach(s => {
        const l = new Date(s.mes_referencia).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (l === mes && s.tipo === 'Saída') {
            cat[s.nome] = (cat[s.nome] || 0) + parseFloat(s.valor);
        }
    });
    renderizarGraficoPizza(Object.keys(cat), Object.values(cat));
}

// --- GRÁFICOS ---
function renderizarGraficoPizza(labels, valores) {
    const ctx = document.getElementById('pizzaChart').getContext('2d');
    if (meuGraficoPizza) meuGraficoPizza.destroy();
    meuGraficoPizza = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: valores, backgroundColor: ['#f1f09d', '#c26f03', '#32D74B', '#9370DB', '#FF453A'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#888b86', usePointStyle: true } }, datalabels: { display: false } } }
    });
}

function renderizarGraficoBarras(labels, sims) {
    const ctx = document.getElementById('patrimonioChart').getContext('2d');
    if (meuGraficoBarras) meuGraficoBarras.destroy();
    const ent = Array(labels.length).fill(0); const sai = Array(labels.length).fill(0);
    sims.forEach(s => {
        const i = labels.indexOf(new Date(s.mes_referencia).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }));
        if (i !== -1) { if (s.tipo === 'Saída') sai[i] += parseFloat(s.valor) * -1; else ent[i] += parseFloat(s.valor); }
    });
    meuGraficoBarras = new Chart(ctx, {
        type: 'bar', plugins: [ChartDataLabels],
        data: { labels, datasets: [{ label: 'Entradas', data: ent, backgroundColor: '#f1f09d', borderRadius: 6 }, { label: 'Saídas', data: sai, backgroundColor: '#c26f03', borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, layout: { padding: { top: 35 } }, plugins: { legend: { display: false }, datalabels: { display: true, color: (c) => c.dataset.data[c.dataIndex] >= 0 ? '#c8f5cf' : '#e5a9a6', anchor: 'end', align: 'top', offset: 8, font: { weight: 'bold' }, formatter: (v, c) => { const i = c.dataIndex; if (i === 0) return ''; const p = c.chart.data.datasets[c.datasetIndex].data[i-1]; if (!p) return ''; const d = ((Math.abs(v)-Math.abs(p))/Math.abs(p))*100; return (d>=0?'+':'')+d.toFixed(0)+'%'; } } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#86868b' }, grace: '20%' }, x: { grid: { display: false }, ticks: { color: '#86868b' } } } }
    });
}

function editarMeta() {
    const n = prompt("Nova meta de investimento (R$):", META_VALOR);
    if (n && !isNaN(n)) {
        META_VALOR = parseFloat(n);
        localStorage.setItem('melon_meta_investimento', META_VALOR);
        atualizarInsightsEMetas(document.getElementById('filtro-mes-pizza').value);
    }
}

function preencherTabela(sims) {
    const tb = document.querySelector('#simulacoes-table tbody');
    tb.innerHTML = "";
    [...sims].reverse().slice(0, 8).forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.nome}</td><td>${s.tipo}</td><td style="color: ${s.tipo === 'Saída' ? '#FF453A' : '#32D74B'}">R$ ${parseFloat(s.valor).toLocaleString('pt-BR')}</td><td><button onclick="deletarSimulacao('${s.id}')">🗑️</button></td>`;
        tb.appendChild(tr);
    });
}

async function deletarSimulacao(id) { if (confirm("Excluir registro?")) { await _supabase.from('simulacoes').delete().eq('id', id); await carregarDados(); } }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }