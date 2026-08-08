const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

let deferredPrompt = null;

function abrirModalIOS() {
    document.getElementById('pwa-install-banner').style.display = 'none';
    document.getElementById('ios-install-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function fecharModalIOS() {
    document.getElementById('ios-install-modal').style.display = 'none';
    document.body.style.overflow = '';
}

export function initInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    const btnInstall = document.getElementById('pwa-btn-install');
    const btnClose = document.getElementById('pwa-btn-close');

    if (!banner || !btnInstall || !btnClose) return;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!isStandalone && !sessionStorage.getItem('pwa-banner-dismissed')) {
            setTimeout(() => { banner.style.display = 'block'; }, 3000);
        }
    });

    btnInstall.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            banner.style.display = 'none';
        }
    });

    btnClose.addEventListener('click', () => {
        banner.style.display = 'none';
        sessionStorage.setItem('pwa-banner-dismissed', '1');
    });

    window.addEventListener('appinstalled', () => {
        banner.style.display = 'none';
        deferredPrompt = null;
    });

    if (isIOS && !isStandalone && !sessionStorage.getItem('pwa-banner-dismissed')) {
        setTimeout(() => {
            banner.style.display = 'block';
            btnInstall.textContent = 'Como instalar';
            btnInstall.addEventListener('click', abrirModalIOS, { once: true });
        }, 3000);
    }
}

window.abrirModalIOS = abrirModalIOS;
window.fecharModalIOS = fecharModalIOS;
