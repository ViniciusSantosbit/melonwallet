import { SIMULACAO_TIPOS } from '../config/constants.js';

export function renderSimulacoesTable(simulacoes, onDelete) {
    const tbody = document.querySelector('#simulacoes-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    [...simulacoes].reverse().slice(0, 8).forEach((s) => {
        const tr = document.createElement('tr');
        const corValor = s.tipo === SIMULACAO_TIPOS.SAIDA ? '#FF453A' : '#32D74B';

        tr.innerHTML = `
            <td>${s.nome}</td>
            <td>${s.tipo}</td>
            <td style="color: ${corValor}">R$ ${parseFloat(s.valor).toLocaleString('pt-BR')}</td>
            <td><button data-delete-id="${s.id}" class="btn-delete">🗑️</button></td>
        `;

        const btnDelete = tr.querySelector('[data-delete-id]');
        btnDelete.addEventListener('click', () => onDelete(s.id));

        tbody.appendChild(tr);
    });
}
