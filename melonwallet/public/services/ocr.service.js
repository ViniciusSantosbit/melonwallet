export async function escanearComprovante(file) {
    if (!file) {
        throw new Error('Nenhuma imagem selecionada');
    }

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) {
        throw new Error('Formato de arquivo não suportado. Use JPG, PNG ou PDF.');
    }

    try {
        const formData = new FormData();
        formData.append('document', file);

        const response = await fetch('/api/ocr', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao processar imagem no OCR.');
        }

        return data;
    } catch (error) {
        console.error("Erro no OCR:", error);
        throw new Error(error.message || 'Erro de conexão ou processamento. Tente novamente.');
    }
}
