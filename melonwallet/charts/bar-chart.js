import { buildBarChartData } from '../utils/finance.util.js';

let barChartInstance = null;

export function renderBarChart(labels, simulacoes) {
    const ctx = document.getElementById('patrimonioChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();

    const { entradas, saidas } = buildBarChartData(labels, simulacoes);

    barChartInstance = new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels,
            datasets: [
                { label: 'Entradas', data: entradas, backgroundColor: '#f1f09d', borderRadius: 6 },
                { label: 'Saídas', data: saidas, backgroundColor: '#c26f03', borderRadius: 6 },
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
                    color: (c) => (c.dataset.data[c.dataIndex] >= 0 ? '#c8f5cf' : '#e5a9a6'),
                    anchor: 'end',
                    align: 'top',
                    offset: 8,
                    font: { weight: 'bold' },
                    formatter: (v, c) => {
                        const i = c.dataIndex;
                        if (i === 0) return '';
                        const p = c.chart.data.datasets[c.datasetIndex].data[i - 1];
                        if (!p) return '';
                        const d = ((Math.abs(v) - Math.abs(p)) / Math.abs(p)) * 100;
                        return (d >= 0 ? '+' : '') + d.toFixed(0) + '%';
                    },
                },
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
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
