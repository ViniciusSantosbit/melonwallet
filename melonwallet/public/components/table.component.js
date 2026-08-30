// table.component.js
import { SIMULACAO_TIPOS } from '/config/constants.js';

export function renderSimulacoesTable(simulacoes, onDelete) {
    const tbody = document.querySelector('#simulacoes-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const transacoesOrdenadas = [...simulacoes].sort((a, b) => {
        const dataA = new Date(a.created_at || a.data || a.data_efetivacao || a.mes_referencia || 0);
        const dataB = new Date(b.created_at || b.data || b.data_efetivacao || b.mes_referencia || 0);
        return dataB - dataA;
    }).slice(0, 8);

    transacoesOrdenadas.forEach((s) => {
        const tr = document.createElement('tr');
        
        const isSaida = s.tipo === 'saida' || s.tipo === 'despesa' || s.tipo === SIMULACAO_TIPOS.SAIDA || parseFloat(s.valor) < 0;
        const corValor = isSaida ? '#FF453A' : '#32D74B';
        const tipoExibicao = isSaida ? 'saída' : s.tipo;
        const valorNumerico = parseFloat(s.valor);
        const valorExibicao = isSaida
            ? `-${Math.abs(valorNumerico).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : valorNumerico.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        const dataRaw = s.created_at || s.data || s.data_efetivacao || s.mes_referencia;
        let dataFormatada = '';
        if (dataRaw) {
            const data = new Date(dataRaw);
            if (!isNaN(data)) {
                const dia = String(data.getDate()).padStart(2, '0');
                const mes = String(data.getMonth() + 1).padStart(2, '0');
                const ano = String(data.getFullYear()).slice(-2);
                const hora = String(data.getHours()).padStart(2, '0');
                const min = String(data.getMinutes()).padStart(2, '0');
                dataFormatada = `<div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 2px;">${dia}/${mes}/${ano} às ${hora}:${min}</div>`;
            }
        }

        tr.innerHTML = `
            <td>
                ${s.nome}
                ${dataFormatada}
            </td>
            <td>${tipoExibicao}</td>
            <td style="color: ${corValor}">R$ ${valorExibicao}</td>
            <td><button data-delete-id="${s.id}" class="btn-delete">🗑️</button></td>
        `;

        const btnDelete = tr.querySelector('[data-delete-id]');
        btnDelete.addEventListener('click', () => onDelete(s.id));

        tbody.appendChild(tr);
    });
}