export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.MINDEE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('document');

        if (!file) {
            return res.status(400).json({ error: 'Nenhum documento enviado' });
        }

        const mindeeForm = new FormData();
        mindeeForm.append('document', file, file.name || 'receipt.jpg');

        const response = await fetch('https://api.mindee.net/v2/products/mindee/receipts/v2/parse', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
            },
            body: mindeeForm,
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ error: `Mindee API error: ${text}` });
        }

        const data = await response.json();

        const prediction = data?.document?.inference?.prediction || {};

        const merchantName = prediction.merchant_name?.value || null;
        const date = prediction.date?.value || null;
        const totalAmount = prediction.total_amount?.value || null;

        const confidences = [
            prediction.merchant_name?.confidence,
            prediction.date?.confidence,
            prediction.total_amount?.confidence,
        ].filter((c) => typeof c === 'number');

        const confidence = confidences.length > 0
            ? confidences.reduce((a, b) => a + b, 0) / confidences.length
            : null;

        res.status(200).json({
            merchant_name: merchantName,
            date: date,
            total_amount: totalAmount,
            confidence: confidence,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
