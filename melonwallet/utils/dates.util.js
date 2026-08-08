export function getMonthLabel(dateInput) {
    return new Date(dateInput).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
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
