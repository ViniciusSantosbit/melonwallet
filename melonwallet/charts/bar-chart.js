// bar-chart.js
import { buildBarChartData } from '../utils/finance.util.js';

let barChartInstance = null;

export function renderBarChart(labels, simulacoes) {
    const ctx = document.getElementById('patrimonioChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();

    const { entradas, saidas } = buildBarChartData(labels, simulacoes);

    // Meses fantasmas: empurra o gráfico para a esquerda (colado no eixo Y) quando há poucos meses
    while (labels.length < 6) {
        labels.push('');
        entradas.push(null);
        saidas.push(null);
    }

    // Largura dinâmica (mínimo para não achatar) -> força scroll horizontal no container
    const canvas = document.getElementById('patrimonioChart');
    canvas.style.width = Math.max(labels.length * 80, 480) + 'px';

    barChartInstance = new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels,
            datasets: [
                { label: 'Entradas', data: entradas, backgroundColor: '#f1f09d', barPercentage: 1.0, categoryPercentage: 0.6 },
                { label: 'Saídas', data: saidas, backgroundColor: '#c26f03', barPercentage: 1.0, categoryPercentage: 0.6 },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 35 } },
            plugins: {
                legend: { display: false },
                datalabels: {
                    display: true,
                    // CORREÇÃO: Define a cor com base no tipo de dataset (entrada/saída)
                    color: (c) => (c.datasetIndex === 0 ? '#c8f5cf' : '#e5a9a6'), 
                    anchor: 'end',
                    align: 'top',
                    offset: 8,
                    font: { size: 9, weight: 'bold' },
                    formatter: (value, context) => {
                        // Esconde labels em meses fantasmas (vazio) e valores zerados
                        if (value === null || typeof value === 'undefined' || value === 0) return null;

                        // Array em ordem decrescente: índice 0 = mês mais recente, +1 = mês anterior cronologicamente
                        const valorAntigo = context.dataset.data[context.dataIndex + 1];
                        if (!valorAntigo) return null;

                        const porcentagem = ((value - valorAntigo) / Math.abs(valorAntigo)) * 100;
                        return (porcentagem >= 0 ? '+' : '') + porcentagem.toFixed(0) + '%';
                    },
                },
            },
            scales: {
                y: {
                    grid: { display: false },
                    ticks: { color: '#86868b' },
                    grace: '20%',
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#86868b' },
                },
            },
        },
    });

    const container = document.querySelector('.chart-container-scroll');
    if (container) {
        setTimeout(() => { container.scrollLeft = 0; }, 300);
    }
}