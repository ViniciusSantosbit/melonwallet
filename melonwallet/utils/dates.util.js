export function getMonthLabel(dateInput) {
    return parseLocalDate(dateInput).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
}

// Interpreta "YYYY-MM-DD" em horário local (evita o bug de fuso do new Date() que lê como UTC)
function parseLocalDate(input) {
    if (typeof input !== 'string') return new Date(input);
    const partes = input.split('-');
    if (partes.length >= 2) {
        const ano = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const dia = partes[2] ? parseInt(partes[2], 10) : 1;
        return new Date(ano, mes, dia);
    }
    return new Date(input);
}

export function getCurrentMonthInput() {
    return new Date().toISOString().substring(0, 7);
}

export function getLongDateString(date = new Date()) {
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('pt-BR', opcoes);
}

export function getCurrentMonthLabel() {
    return new Date().toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
}

export function getPreviousMonthLabel() {
    const dataAnt = new Date();
    dataAnt.setMonth(dataAnt.getMonth() - 1);
    return dataAnt.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
}
