import { importarTransacoesPluggy } from '../../services/simulacoes.service.js';
import { showMelonAlert } from '../../utils/modal.util.js';
import { supabaseClient } from '/config/supabase.js';
import { getUserId } from '/storage/session.storage.js';

export async function verificarConexaoPluggy() {
    const userId = getUserId();
    if (!userId) return false;

    const { data, error } = await supabaseClient
        .from('simulacoes')
        .select('id')
        .eq('user_id', userId)
        .eq('origem', 'open_finance')
        .limit(1);

    if (error) {
        console.error('[Pluggy] Erro ao verificar conexão:', error);
        return false;
    }

    return data && data.length > 0;
}

export async function gerarConnectToken() {
    const response = await fetch('/api/pluggy-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const erro = await response.text();
        throw new Error(`Erro ao gerar token Pluggy (${response.status}): ${erro}`);
    }

    const data = await response.json();
    return data.connectToken;
}

export function abrirPluggyWidget(connectToken, onSyncComplete) {
    return new Promise((resolve, reject) => {
        if (typeof PluggyConnect === 'undefined') {
            reject(new Error('A biblioteca Pluggy não foi carregada. Verifique sua conexão ou desative o bloqueador de pop-ups/anedotas do navegador e recarregue a página.'));
            return;
        }

        const pluggyConnect = new PluggyConnect({
            connectToken,
            onSuccess: async (itemData) => {
                console.log("Payload recebido da Pluggy:", itemData);

                const itemId = itemData?.item?.id || itemData?.id;

                if (!itemId) {
                    throw new Error("ID do item não encontrado no payload da Pluggy");
                }

                console.log("Iniciando busca de transações para o itemId:", itemId);

                try {
                    const response = await fetch('/api/pluggy-transactions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ itemId }),
                    });

                    const resultado = await response.json();

                    if (!response.ok) {
                        throw new Error(resultado.error || 'Erro ao importar');
                    }

                    const transacoes = resultado.results || resultado;

                    if (Array.isArray(transacoes) && transacoes.length > 0) {
                        await importarTransacoesPluggy(transacoes);
                    }

                    console.log("Transações salvas com sucesso!", transacoes);

                    if (onSyncComplete) {
                        await onSyncComplete();
                    }

                    resolve(resultado);
                } catch (error) {
                    console.error("Erro detalhado na importação:", error);
                    reject(error);
                }
            },
            onError: (error) => {
                console.error('Erro no Pluggy Connect:', error);
                reject(error);
            },
            onClose: () => {
                console.log('Pluggy Connect fechado pelo usuário.');
                resolve([]);
            },
        });

        try {
            pluggyConnect.init();
        } catch (error) {
            reject(new Error('Não foi possível abrir o widget da Pluggy. Se o navegador bloqueou a janela, desative o bloqueador de pop-ups para este site e tente novamente.'));
        }
    });
}

export async function sincronizarBanco(onSyncComplete) {
    const connectToken = await gerarConnectToken();
    return abrirPluggyWidget(connectToken, onSyncComplete);
}

export function initPluggySyncButton(onSyncComplete) {
    const btn = document.getElementById('btn-sync-bank');
    const statusWrapper = document.getElementById('bank-status-wrapper');
    const statusText = document.getElementById('bank-status');
    if (!btn) return;

    verificarConexaoPluggy().then(conectado => {
        if (conectado && statusWrapper && statusText) {
            btn.classList.add('hidden');
            statusWrapper.classList.remove('hidden');
            statusText.textContent = '🏦 Conta Conectada';
        } else {
            btn.classList.remove('hidden');
            if (statusWrapper) statusWrapper.classList.add('hidden');
        }
    });

    btn.addEventListener('click', async () => {
        console.log('Botão Sincronizar clicado!');
        const textoOriginal = btn.textContent;

        try {
            btn.disabled = true;
            btn.textContent = 'Sincronizando...';
            await sincronizarBanco(onSyncComplete);

            if (statusWrapper && statusText) {
                btn.classList.add('hidden');
                statusWrapper.classList.remove('hidden');
                statusText.textContent = '🏦 Conta Conectada';
            }
        } catch (error) {
            console.error('Erro na sincronização Open Finance:', error);
            await showMelonAlert('Não foi possível completar a sincronização: ' + error.message, { type: 'error' });
        } finally {
            btn.disabled = false;
            btn.textContent = textoOriginal;
        }
    });
}
