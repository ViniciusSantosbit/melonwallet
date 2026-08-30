import { getMetaInvestimento as adapterGetMeta, setMetaInvestimento as adapterSetMeta } from '/adapters/supabase/goal.adapter.js';

export function getMetaInvestimento() {
    return adapterGetMeta();
}

export function setMetaInvestimento(valor) {
    return adapterSetMeta(valor);
}