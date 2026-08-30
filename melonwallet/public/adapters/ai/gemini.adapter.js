export async function chamarGemini(prompt) {
    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        const erro = await response.text();
        throw new Error(`Erro na API interna (${response.status}): ${erro}`);
    }

    const data = await response.json();
    return data.resposta || '';
}
