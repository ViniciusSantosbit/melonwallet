// bar-chart.js
import { buildBarChartData } from '../utils/finance.util.js';

let barChartInstance = null;

export function renderBarChart(labels, simulacoes) {
    const ctx = document.getElementById('patrimonioChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();

    if (labels.length > 5) {
        const canvas = document.getElementById('patrimonioChart');
        canvas.style.width = (labels.length * 110) + 'px';
    }

    const { entradas, saidas } = buildBarChartData(labels, simulacoes);

    barChartInstance = new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels,
            datasets: [
                { label: 'Entradas', data: entradas, backgroundColor: '#f1f09d', barPercentage: 0.95, categoryPercentage: 1.0 },
                { label: 'Saídas', data: saidas, backgroundColor: '#c26f03', barPercentage: 0.95, categoryPercentage: 1.0 },
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
                    formatter: (v, c) => {
                        const i = c.dataIndex;
                        if (i === 0) return '';
                        const p = c.chart.data.datasets[c.datasetIndex].data[i - 1];
                        if (!p || p === 0) return ''; // Evita divisão por zero
                        const d = ((Math.abs(v) - Math.abs(p)) / Math.abs(p)) * 100;
                        return (d >= 0 ? '+' : '') + d.toFixed(0) + '%';
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
}