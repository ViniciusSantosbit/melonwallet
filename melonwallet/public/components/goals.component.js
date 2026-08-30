export function renderGoalProgress({ progresso, investTotal, metaValor }) {
    document.getElementById('goal-progress-bar').style.width = progresso + '%';
    document.getElementById('goal-percent-text').innerText = Math.floor(progresso) + '%';
    document.getElementById('goal-value-text').innerText =
        `R$ ${investTotal.toLocaleString('pt-BR')} / R$ ${metaValor.toLocaleString('pt-BR')}`;
}

export function renderTopExpenses(topGastos) {
    const container = document.getElementById('top-expenses-container');
    container.innerHTML = topGastos.length ? '' : "<p style='color:#86868b'>Sem gastos.</p>";

    topGastos.forEach(([nome, valor]) => {
        container.innerHTML += `
            <div class="expense-insight-card">
                <span>${nome}</span>
                <b>R$ ${valor.toLocaleString('pt-BR')}</b>
            </div>
        `;
    });
}
