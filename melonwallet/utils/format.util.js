export function formatBRL(valor, options = { minimumFractionDigits: 2 }) {
    return valor.toLocaleString('pt-BR', options);
}

export function formatCurrency(valor) {
    return `R$ ${formatBRL(parseFloat(valor))}`;
}
