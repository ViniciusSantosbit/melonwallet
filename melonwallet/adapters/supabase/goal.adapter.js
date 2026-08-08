import { DEFAULT_META_INVESTIMENTO, STORAGE_KEYS } from '../../config/constants.js';

export function getMetaInvestimento() {
    const salva = localStorage.getItem(STORAGE_KEYS.META_INVESTIMENTO);
    return salva && salva !== 'undefined' ? parseFloat(salva) : DEFAULT_META_INVESTIMENTO;
}

export function setMetaInvestimento(valor) {
    localStorage.setItem(STORAGE_KEYS.META_INVESTIMENTO, valor);
}