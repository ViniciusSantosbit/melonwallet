export async function enviarImagemOCR(file) {
    const form = new FormData();
    form.append('document', file);

    const response = await fetch('/api/ocr', {
        method: 'POST',
        body: form,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar imagem');
    }

    return response.json();
}
