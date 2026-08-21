export function abrirModal() {
    document.getElementById('modal-simulacao').style.display = 'flex';

    const campoData = document.getElementById('dataSimulacao');
    if (campoData) {
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        campoData.value = agora.toISOString().slice(0, 16);
    }
}

export function fecharModal() {
    document.getElementById('modal-simulacao').style.display = 'none';
}
