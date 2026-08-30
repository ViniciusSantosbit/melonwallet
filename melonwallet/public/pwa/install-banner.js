const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

let deferredPrompt = null;

function abrirModalIOS() {
    const modal = document.getElementById('ios-install-modal');
    if (modal) modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function fecharModalIOS() {
    const modal = document.getElementById('ios-install-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

export function initInstallBanner() {
    const btnBaixar = document.getElementById('btn-baixar-app');
    if (!btnBaixar) return;

    // Oculta até que o navegador permita a instalação (beforeinstallprompt)
    btnBaixar.style.display = 'none';

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!isStandalone) {
            btnBaixar.style.display = 'block';
        }
    });

    btnBaixar.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            btnBaixar.style.display = 'none';
        } else if (isIOS && !isStandalone) {
            abrirModalIOS();
        }
    });

    window.addEventListener('appinstalled', () => {
        btnBaixar.style.display = 'none';
        deferredPrompt = null;
    });

    // iOS não dispara beforeinstallprompt: mostra o botão direcionando ao passo-a-passo
    if (isIOS && !isStandalone) {
        btnBaixar.style.display = 'block';
        btnBaixar.textContent = 'Como instalar no iPhone';
    }
}

window.abrirModalIOS = abrirModalIOS;
window.fecharModalIOS = fecharModalIOS;
