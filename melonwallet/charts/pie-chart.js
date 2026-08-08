let pieChartInstance = null;

const PIE_COLORS = [
    '#efeb03', '#c26f03', '#32D74B', '#9370DB', '#ee170c', '#f099b3',
    '#0000ff', '#ccc3c3', '#20b2aa', '#008080', '#BDB76B', '#F5DEB3',
    '#FA8072', '#2F4F4F', '#D8BFD8',
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
