import { enviarImagemOCR } from '../adapters/ocr/mindee.adapter.js';

export async function escanearComprovante(file) {
    if (!file) {
        throw new Error('Nenhuma imagem selecionada');
    }

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) {
        throw new Error('Formato de arquivo não suportado. Use JPG, PNG ou PDF.');
    }

    try {
        const dados = await enviarImagemOCR(file);

        if (!dados.merchant_name && !dados.date && !dados.total_amount) {
            throw new Error('Imagem ilegível ou não é um comprovante válido');
        }

        return dados;
    } catch (error) {
        if (error.message.includes('Mindee') || error.message.includes('Erro ao processar')) {
            throw error;
        }
        throw new Error('Erro de conexão. Tente novamente.');
    }
}
