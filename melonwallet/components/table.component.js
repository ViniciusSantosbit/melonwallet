// table.component.js
import { SIMULACAO_TIPOS } from '../config/constants.js';

export function renderSimulacoesTable(simulacoes, onDelete) {
    const tbody = document.querySelector('#simulacoes-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    [...simulacoes].reverse().slice(0, 8).forEach((s) => {
        const tr = document.createElement('tr');
        
        const isSaida = s.tipo === 'saida' || s.tipo === 'despesa' || s.tipo === SIMULACAO_TIPOS.SAIDA || parseFloat(s.valor) < 0;
        const corValor = isSaida ? '#FF453A' : '#32D74B';
        const tipoExibicao = isSaida ? 'saída' : s.tipo;
        const valorNumerico = parseFloat(s.valor);
        const valorExibicao = isSaida
            ? `-${Math.abs(valorNumerico).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : valorNumerico.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        tr.innerHTML = `
            <td>${s.nome}</td>
            <td>${tipoExibicao}</td>
            <td style="color: ${corValor}">R$ ${valorExibicao}</td>
            <td><button data-delete-id="${s.id}" class="btn-delete">🗑️</button></td>
        `;

        const btnDelete = tr.querySelector('[data-delete-id]');
        btnDelete.addEventListener('click', () => onDelete(s.id));

        tbody.appendChild(tr);
    });
}