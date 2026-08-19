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

export function abrirPluggyWidget(connectToken) {
    if (typeof PluggyConnect === 'undefined') {
        throw new Error('A biblioteca Pluggy não foi carregada. Verifique sua conexão ou desative o bloqueador de pop-ups/anedotas do navegador e recarregue a página.');
    }

    const pluggyConnect = new PluggyConnect({
        connectToken,
        onSuccess: (itemData) => {
            console.log('Item ID gerado com sucesso:', itemData.item.id);
        },
        onError: (error) => {
            console.error('Erro no Pluggy Connect:', error);
        },
        onClose: () => {
            console.log('Pluggy Connect fechado pelo usuário.');
        },
    });

    // O SDK v2 do Pluggy Connect abre o widget embutido na página
    // (overlay/iframe modal dentro do próprio documento), evitando
    // janelas popup bloqueadas pelo navegador.
    try {
        pluggyConnect.init();
    } catch (error) {
        throw new Error('Não foi possível abrir o widget da Pluggy. Se o navegador bloqueou a janela, desative o bloqueador de pop-ups para este site e tente novamente.');
    }
}

export async function sincronizarBanco() {
    const connectToken = await gerarConnectToken();
    abrirPluggyWidget(connectToken);
}

export function initPluggySyncButton() {
    const btn = document.getElementById('btn-sync-bank');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        console.log('Botão Sincronizar clicado!');
        const textoOriginal = btn.textContent;

        try {
            btn.disabled = true;
            btn.textContent = 'Sincronizando...';
            await sincronizarBanco();
        } catch (error) {
            console.error('Erro na sincronização Open Finance:', error);
            alert('Não foi possível iniciar a sincronização: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = textoOriginal;
        }
    });
}
