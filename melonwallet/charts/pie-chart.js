let pieChartInstance = null;

const PIE_COLORS = [
    '#efeb03', '#c26f03', '#32D74B', '#9370DB', '#ee170c', '#f099b3',
    '#00ff87', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8',
    '#00cec9', '#e17055', '#0984e3', '#fdcb6e', '#6c5ce7', '#00b894',
    '#e84393', '#f39c12',
];

export function renderPieChart(labels, valores) {
    const ctx = document.getElementById('pizzaChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data: valores, backgroundColor: PIE_COLORS, borderWidth: 0 }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#888b86', usePointStyle: true } },
                datalabels: { display: false },
            },
        },
    });
}
